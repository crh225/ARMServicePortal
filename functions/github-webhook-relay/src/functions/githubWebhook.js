import { app } from "@azure/functions";
import crypto from "crypto";
import amqp from "amqplib";

// RabbitMQ connection (reused across invocations)
let channel = null;
let connection = null;

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
 * Get or create RabbitMQ channel
 */
async function getRabbitMQChannel(context) {
  const rabbitmqUrl = process.env.RABBITMQ_URL;

  if (!rabbitmqUrl) {
    throw new Error("RABBITMQ_URL environment variable not configured");
  }

  // Return existing channel if still open
  if (channel && connection) {
    return channel;
  }

  try {
    context.log("Connecting to RabbitMQ...");
    connection = await amqp.connect(rabbitmqUrl);
    channel = await connection.createChannel();

    // Declare exchange and queue
    const exchange = process.env.RABBITMQ_EXCHANGE || "github-webhooks";
    const queue = process.env.RABBITMQ_QUEUE || "notifications";

    await channel.assertExchange(exchange, "topic", { durable: true });
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, exchange, "workflow.*");

    context.log(`Connected to RabbitMQ, exchange: ${exchange}, queue: ${queue}`);

    // Handle connection close
    connection.on("close", () => {
      context.log("RabbitMQ connection closed");
      channel = null;
      connection = null;
    });

    return channel;
  } catch (error) {
    context.error("Failed to connect to RabbitMQ:", error.message);
    channel = null;
    connection = null;
    throw error;
  }
}

/**
 * Parse workflow run data into notification message
 */
function parseWorkflowRun(webhookData) {
  const { action, workflow_run } = webhookData;

  if (!workflow_run) {
    return null;
  }

  // Extract PR number from pull_requests array
  let prNumber = null;
  if (workflow_run.pull_requests && workflow_run.pull_requests.length > 0) {
    prNumber = workflow_run.pull_requests[0].number;
  }

  // Parse job info from workflow name (e.g., "terraform-plan-azure-storage-basic-dev")
  let environment = null;
  let blueprint = null;
  const workflowName = workflow_run.name || "";

  // Try to extract from display_title or name
  const match = workflowName.match(/terraform-(plan|apply)-([a-z0-9-]+)-(\w+)$/i);
  if (match) {
    blueprint = match[2];
    environment = match[3];
  }

  // Determine notification type
  let type = "info";
  if (workflow_run.conclusion === "success") {
    type = "success";
  } else if (workflow_run.conclusion === "failure") {
    type = "error";
  } else if (workflow_run.status === "in_progress") {
    type = "info";
  }

  // Create notification title
  let title = "";
  if (action === "completed") {
    title = workflow_run.conclusion === "success"
      ? `Workflow Completed: ${workflow_run.name}`
      : `Workflow Failed: ${workflow_run.name}`;
  } else if (action === "requested" || action === "in_progress") {
    title = `Workflow Started: ${workflow_run.name}`;
  } else {
    title = `Workflow ${action}: ${workflow_run.name}`;
  }

  return {
    type,
    title,
    message: workflow_run.display_title || workflow_run.name,
    prNumber,
    jobId: workflow_run.id?.toString(),
    environment,
    blueprint,
    url: workflow_run.html_url,
    action,
    status: workflow_run.status,
    conclusion: workflow_run.conclusion,
    timestamp: new Date().toISOString()
  };
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

      context.log(`Event: ${event}, Signature present: ${!!signature}`);

      // Verify signature
      const secret = process.env.GITHUB_WEBHOOK_SECRET;
      if (!verifySignature(rawBody, signature, secret)) {
        context.warn("Invalid webhook signature");
        return {
          status: 401,
          jsonBody: { error: "Invalid signature" }
        };
      }

      // Parse body
      const webhookData = JSON.parse(rawBody);

      // Only process workflow_run events
      if (event !== "workflow_run") {
        context.log(`Ignoring event type: ${event}`);
        return {
          status: 200,
          jsonBody: { message: `Event type '${event}' not processed` }
        };
      }

      const { action } = webhookData;
      context.log(`Workflow run action: ${action}`);

      // Parse notification message
      const notification = parseWorkflowRun(webhookData);

      if (!notification) {
        return {
          status: 200,
          jsonBody: { message: "No notification to send" }
        };
      }

      // Publish to RabbitMQ
      const ch = await getRabbitMQChannel(context);
      const exchange = process.env.RABBITMQ_EXCHANGE || "github-webhooks";
      const routingKey = `workflow.${action}`;

      const messageBuffer = Buffer.from(JSON.stringify(notification));

      ch.publish(exchange, routingKey, messageBuffer, {
        persistent: true,
        contentType: "application/json"
      });

      context.log(`Published notification to RabbitMQ: ${routingKey}`, notification.title);

      return {
        status: 200,
        jsonBody: {
          success: true,
          message: "Webhook processed and published to RabbitMQ",
          notification: {
            type: notification.type,
            title: notification.title,
            prNumber: notification.prNumber
          }
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
    return {
      status: 200,
      jsonBody: {
        status: "healthy",
        timestamp: new Date().toISOString(),
        rabbitmqConnected: !!channel
      }
    };
  }
});
