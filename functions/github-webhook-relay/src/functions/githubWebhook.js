import { app } from "@azure/functions";
import crypto from "crypto";
import amqp from "amqplib";

/**
 * Azure Function: GitHub Webhook → RabbitMQ Publisher
 *
 * This function receives GitHub webhooks and publishes them to RabbitMQ.
 * The backend API consumes messages from RabbitMQ and broadcasts via SSE.
 *
 * Architecture:
 * GitHub → Azure Function → RabbitMQ → Backend API → Redis + SSE → Frontend
 *
 * Why publish to RabbitMQ?
 * - Decouples webhook ingestion from notification processing
 * - RabbitMQ handles message persistence and delivery guarantees
 * - Backend can process messages at its own pace
 * - Enables future scaling and multiple consumers
 */

// RabbitMQ connection (cached for reuse across invocations)
let rabbitConnection = null;
let rabbitChannel = null;

const EXCHANGE_NAME = "github-webhooks";
const ROUTING_KEY = "webhook.github";

/**
 * Get or create RabbitMQ connection
 */
async function getRabbitChannel(context) {
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
      context.log("RabbitMQ connection lost, reconnecting...");
      rabbitConnection = null;
      rabbitChannel = null;
    }
  }

  context.log("Connecting to RabbitMQ...");
  rabbitConnection = await amqp.connect(rabbitUrl);
  rabbitChannel = await rabbitConnection.createChannel();

  // Declare exchange (idempotent)
  await rabbitChannel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
  context.log("RabbitMQ connection established");

  return rabbitChannel;
}

/**
 * Verify GitHub webhook signature
 */
function verifySignature(payload, signature, secret) {
  if (!secret) {
    console.warn("GITHUB_WEBHOOK_SECRET not configured - skipping verification");
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
async function publishToRabbitMQ(notification, context) {
  const channel = await getRabbitChannel(context);

  const message = Buffer.from(JSON.stringify(notification));

  channel.publish(EXCHANGE_NAME, ROUTING_KEY, message, {
    persistent: true,
    contentType: "application/json",
    timestamp: Date.now()
  });

  context.log(`Published notification to RabbitMQ: ${notification.title}`);
}

/**
 * GitHub Webhook HTTP Trigger
 */
app.http("githubWebhook", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "webhooks/github",
  handler: async (request, context) => {
    context.log("GitHub webhook received");

    try {
      // Get raw body for signature verification
      const rawBody = await request.text();
      const signature = request.headers.get("x-hub-signature-256");
      const event = request.headers.get("x-github-event");
      const deliveryId = request.headers.get("x-github-delivery");

      context.log(`Event: ${event}, Delivery: ${deliveryId}, Signature present: ${!!signature}`);

      // Verify signature (GH_ prefix required by GitHub Actions)
      const secret = process.env.GH_WEBHOOK_SECRET;
      if (secret && !verifySignature(rawBody, signature, secret)) {
        context.warn("Invalid webhook signature - rejecting");
        return {
          status: 401,
          jsonBody: { error: "Invalid signature" }
        };
      }

      // Handle ping event (GitHub sends this when webhook is first configured)
      if (event === "ping") {
        context.log("Ping event received - webhook configured successfully");
        return {
          status: 200,
          jsonBody: { message: "Pong! Webhook configured successfully." }
        };
      }

      // Transform webhook to notification
      const notification = transformToNotification(event, rawBody);
      notification.deliveryId = deliveryId;

      // Publish to RabbitMQ
      await publishToRabbitMQ(notification, context);

      return {
        status: 200,
        jsonBody: {
          success: true,
          notificationId: notification.id,
          message: "Webhook processed and published to queue"
        }
      };
    } catch (error) {
      context.error("Error processing webhook:", error);
      return {
        status: 500,
        jsonBody: { error: error.message }
      };
    }
  }
});

/**
 * Health check endpoint
 */
app.http("health", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "health",
  handler: async (request, context) => {
    const rabbitUrl = process.env.RABBITMQ_URL;

    // Check RabbitMQ connectivity
    let rabbitHealthy = false;
    if (rabbitUrl) {
      try {
        const channel = await getRabbitChannel(context);
        rabbitHealthy = !!channel;
      } catch (error) {
        context.warn("RabbitMQ health check failed:", error.message);
        rabbitHealthy = false;
      }
    }

    return {
      status: 200,
      jsonBody: {
        status: "healthy",
        timestamp: new Date().toISOString(),
        rabbitMQConfigured: !!rabbitUrl,
        rabbitMQHealthy: rabbitHealthy
      }
    };
  }
});
