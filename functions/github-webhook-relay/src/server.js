import express from "express";
import crypto from "crypto";
import amqp from "amqplib";

/**
 * GitHub Webhook Relay Server
 *
 * Standalone Express server that receives GitHub webhooks and publishes them to RabbitMQ.
 * Designed to run in Kubernetes alongside the main backend.
 *
 * Architecture:
 * GitHub → Webhook Relay (this) → RabbitMQ → Backend API → Redis + SSE → Frontend
 */

const app = express();
const PORT = process.env.PORT || 3000;

// RabbitMQ connection (cached for reuse)
let rabbitConnection = null;
let rabbitChannel = null;

const EXCHANGE_NAME = "github-webhooks";
const ROUTING_KEY = "webhook.github";

/**
 * Get or create RabbitMQ connection
 */
async function getRabbitChannel() {
  const rabbitUrl = process.env.RABBITMQ_URL;

  if (!rabbitUrl) {
    throw new Error("RABBITMQ_URL environment variable not configured");
  }

  // Reuse existing connection if available
  if (rabbitConnection && rabbitChannel) {
    try {
      // Check if connection is still alive
      await rabbitChannel.checkExchange(EXCHANGE_NAME);
      return rabbitChannel;
    } catch {
      // Connection lost, recreate
      console.log("RabbitMQ connection lost, reconnecting...");
      rabbitConnection = null;
      rabbitChannel = null;
    }
  }

  console.log("Connecting to RabbitMQ at:", rabbitUrl.replace(/:[^:@]+@/, ':****@'));
  try {
    rabbitConnection = await amqp.connect(rabbitUrl);
    rabbitChannel = await rabbitConnection.createChannel();
  } catch (err) {
    console.error("Failed to connect to RabbitMQ:", err.message);
    throw err;
  }

  // Declare exchange (idempotent)
  await rabbitChannel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
  console.log("RabbitMQ connection established");

  // Handle connection close
  rabbitConnection.on("close", () => {
    console.log("RabbitMQ connection closed");
    rabbitConnection = null;
    rabbitChannel = null;
  });

  rabbitConnection.on("error", (err) => {
    console.error("RabbitMQ connection error:", err.message);
    rabbitConnection = null;
    rabbitChannel = null;
  });

  return rabbitChannel;
}

/**
 * Verify GitHub webhook signature
 */
function verifySignature(payload, signature, secret) {
  if (!secret) {
    console.warn("GH_WEBHOOK_SECRET not configured - skipping verification");
    return true;
  }

  if (!signature) {
    return false;
  }

  const hmac = crypto.createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update(payload).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * Transform GitHub webhook into notification format
 */
function transformToNotification(event, payload) {
  const data = JSON.parse(payload);
  const notification = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    type: event,
    read: false
  };

  switch (event) {
    case "workflow_run":
      notification.title = `Workflow ${data.action}: ${data.workflow_run?.name || "Unknown"}`;
      notification.message = `${data.workflow_run?.head_commit?.message || "No message"} - ${data.workflow_run?.conclusion || data.action}`;
      notification.prNumber = data.workflow_run?.pull_requests?.[0]?.number || null;
      notification.repository = data.repository?.full_name;
      notification.url = data.workflow_run?.html_url;
      break;

    case "workflow_job":
      notification.title = `Job ${data.action}: ${data.workflow_job?.name || "Unknown"}`;
      notification.message = `${data.workflow_job?.conclusion || data.action} in ${data.workflow?.name || "workflow"}`;
      notification.prNumber = null;
      notification.repository = data.repository?.full_name;
      notification.url = data.workflow_job?.html_url;
      break;

    case "check_run":
      notification.title = `Check ${data.action}: ${data.check_run?.name || "Unknown"}`;
      notification.message = `${data.check_run?.conclusion || data.action}`;
      notification.prNumber = data.check_run?.pull_requests?.[0]?.number || null;
      notification.repository = data.repository?.full_name;
      notification.url = data.check_run?.html_url;
      break;

    case "pull_request":
      notification.title = `PR ${data.action}: #${data.pull_request?.number}`;
      notification.message = data.pull_request?.title || "No title";
      notification.prNumber = data.pull_request?.number;
      notification.repository = data.repository?.full_name;
      notification.url = data.pull_request?.html_url;
      break;

    case "push":
      notification.title = `Push to ${data.ref?.replace("refs/heads/", "") || "branch"}`;
      notification.message = data.head_commit?.message || "No message";
      notification.prNumber = null;
      notification.repository = data.repository?.full_name;
      notification.url = data.compare;
      break;

    case "deployment":
    case "deployment_status":
      notification.title = `Deployment ${data.action || data.deployment_status?.state}`;
      notification.message = `${data.deployment?.environment || "environment"}: ${data.deployment_status?.description || ""}`;
      notification.prNumber = null;
      notification.repository = data.repository?.full_name;
      notification.url = data.deployment?.url || data.deployment_status?.target_url;
      break;

    default:
      notification.title = `GitHub Event: ${event}`;
      notification.message = `Action: ${data.action || "unknown"}`;
      notification.repository = data.repository?.full_name;
      notification.url = data.repository?.html_url;
  }

  return notification;
}

/**
 * Publish notification to RabbitMQ
 */
async function publishToRabbitMQ(notification) {
  const channel = await getRabbitChannel();

  const message = Buffer.from(JSON.stringify(notification));

  channel.publish(EXCHANGE_NAME, ROUTING_KEY, message, {
    persistent: true,
    contentType: "application/json",
    timestamp: Date.now()
  });

  console.log(`Published notification to RabbitMQ: ${notification.title}`);
}

// Middleware to get raw body for signature verification
app.use("/api/webhooks/github", express.raw({ type: "*/*" }));
app.use(express.json());

/**
 * GitHub Webhook endpoint
 */
app.post("/api/webhooks/github", async (req, res) => {
  console.log("GitHub webhook received");

  try {
    const rawBody = req.body.toString();
    const signature = req.get("x-hub-signature-256");
    const event = req.get("x-github-event");
    const deliveryId = req.get("x-github-delivery");

    console.log(`Event: ${event}, Delivery: ${deliveryId}, Signature present: ${!!signature}`);

    // Verify signature
    const secret = process.env.GH_WEBHOOK_SECRET;
    if (secret && !verifySignature(rawBody, signature, secret)) {
      console.warn("Invalid webhook signature - rejecting");
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Handle ping event
    if (event === "ping") {
      console.log("Ping event received - webhook configured successfully");
      return res.json({ message: "Pong! Webhook configured successfully." });
    }

    // Transform webhook to notification
    const notification = transformToNotification(event, rawBody);
    notification.deliveryId = deliveryId;

    // Publish to RabbitMQ
    await publishToRabbitMQ(notification);

    res.json({
      success: true,
      notificationId: notification.id,
      message: "Webhook processed and published to queue"
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Health check endpoint
 */
app.get("/api/health", async (req, res) => {
  const rabbitUrl = process.env.RABBITMQ_URL;

  let rabbitHealthy = false;
  if (rabbitUrl) {
    try {
      const channel = await getRabbitChannel();
      rabbitHealthy = !!channel;
    } catch (error) {
      console.warn("RabbitMQ health check failed:", error.message);
      rabbitHealthy = false;
    }
  }

  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    rabbitMQConfigured: !!rabbitUrl,
    rabbitMQHealthy: rabbitHealthy
  });
});

/**
 * Liveness probe - simple check that server is running
 */
app.get("/healthz", (req, res) => {
  res.send("OK");
});

/**
 * Readiness probe - check dependencies
 */
app.get("/readyz", async (req, res) => {
  try {
    const channel = await getRabbitChannel();
    if (channel) {
      res.send("OK");
    } else {
      res.status(503).send("RabbitMQ not ready");
    }
  } catch (error) {
    res.status(503).send(`Not ready: ${error.message}`);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`GitHub Webhook Relay listening on port ${PORT}`);
  console.log(`Endpoints:`);
  console.log(`  POST /api/webhooks/github - Receive GitHub webhooks`);
  console.log(`  GET  /api/health          - Health check with RabbitMQ status`);
  console.log(`  GET  /healthz             - Liveness probe`);
  console.log(`  GET  /readyz              - Readiness probe`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully...");
  if (rabbitConnection) {
    await rabbitConnection.close();
  }
  process.exit(0);
});
