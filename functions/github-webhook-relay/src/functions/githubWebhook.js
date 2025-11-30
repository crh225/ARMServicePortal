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
 * Truncate text to max length
 */
function truncate(text, maxLength = 80) {
  if (!text) return "";
  const firstLine = text.split("\n")[0].trim();
  return firstLine.length > maxLength ? firstLine.slice(0, maxLength - 3) + "..." : firstLine;
}

/**
 * Get status emoji based on action/conclusion
 */
function getStatusEmoji(status) {
  const map = {
    success: "✅",
    completed: "✅",
    failure: "❌",
    failed: "❌",
    cancelled: "⚪",
    skipped: "⏭️",
    in_progress: "🔄",
    queued: "⏳",
    requested: "📋",
    opened: "📬",
    closed: "📭",
    merged: "🔀"
  };
  return map[status?.toLowerCase()] || "📌";
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
    case "workflow_run": {
      const status = data.workflow_run?.conclusion || data.action;
      const emoji = getStatusEmoji(status);
      const workflowName = data.workflow_run?.name || "Workflow";
      notification.title = `${emoji} ${workflowName}`;
      notification.message = status;
      notification.prNumber = data.workflow_run?.pull_requests?.[0]?.number || null;
      notification.repository = data.repository?.full_name;
      notification.url = data.workflow_run?.html_url;
      break;
    }

    case "workflow_job": {
      const status = data.workflow_job?.conclusion || data.action;
      const emoji = getStatusEmoji(status);
      notification.title = `${emoji} ${data.workflow_job?.name || "Job"}`;
      notification.message = status;
      notification.prNumber = null;
      notification.repository = data.repository?.full_name;
      notification.url = data.workflow_job?.html_url;
      break;
    }

    case "check_run": {
      const status = data.check_run?.conclusion || data.action;
      const emoji = getStatusEmoji(status);
      notification.title = `${emoji} ${data.check_run?.name || "Check"}`;
      notification.message = status;
      notification.prNumber = data.check_run?.pull_requests?.[0]?.number || null;
      notification.repository = data.repository?.full_name;
      notification.url = data.check_run?.html_url;
      break;
    }

    case "pull_request": {
      const emoji = getStatusEmoji(data.action);
      notification.title = `${emoji} PR #${data.pull_request?.number} ${data.action}`;
      notification.message = truncate(data.pull_request?.title);
      notification.prNumber = data.pull_request?.number;
      notification.repository = data.repository?.full_name;
      notification.url = data.pull_request?.html_url;
      break;
    }

    case "push": {
      const branch = data.ref?.replace("refs/heads/", "") || "branch";
      notification.title = `📦 Push to ${branch}`;
      notification.message = truncate(data.head_commit?.message);
      notification.prNumber = null;
      notification.repository = data.repository?.full_name;
      notification.url = data.compare;
      break;
    }

    case "deployment":
    case "deployment_status": {
      const status = data.deployment_status?.state || data.action;
      const emoji = getStatusEmoji(status);
      notification.title = `${emoji} Deploy: ${data.deployment?.environment || "env"}`;
      notification.message = status;
      notification.prNumber = null;
      notification.repository = data.repository?.full_name;
      notification.url = data.deployment?.url || data.deployment_status?.target_url;
      break;
    }

    default:
      notification.title = `📌 ${event}`;
      notification.message = data.action || "";
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
