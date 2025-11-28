import React, { useState } from "react";
import "../../styles/CrossplaneCredentials.css";

/**
 * Generate kubectl commands for retrieving Crossplane resource credentials
 */
function generateKubectlCommands(blueprintId, name, environment) {
  const namespace = `${name}-${environment}`;

  // Different blueprints have different secret patterns
  const commands = {
    "xp-rabbitmq": [
      {
        label: "Get RabbitMQ credentials",
        command: `kubectl get secret ${name}-${environment}-rabbitmq-admin -n ${namespace} -o jsonpath='{.data.username}' | base64 -d && echo`,
        description: "Decode the admin username"
      },
      {
        label: "Get RabbitMQ password",
        command: `kubectl get secret ${name}-${environment}-rabbitmq-admin -n ${namespace} -o jsonpath='{.data.password}' | base64 -d && echo`,
        description: "Decode the admin password"
      },
      {
        label: "Get Management URL",
        command: `kubectl get ingress -n ${namespace} -o jsonpath='{.items[0].spec.rules[0].host}'`,
        description: "Get the external management UI URL"
      },
      {
        label: "Check pod status",
        command: `kubectl get pods -n ${namespace}`,
        description: "View RabbitMQ pod status"
      }
    ],
    "xp-redis": [
      {
        label: "Check Redis pod status",
        command: `kubectl get pods -n ${namespace}`,
        description: "View Redis pod status"
      },
      {
        label: "Get Redis service endpoint",
        command: `kubectl get svc -n ${namespace} -o jsonpath='{.items[0].metadata.name}:{.items[0].spec.ports[0].port}'`,
        description: "Get the internal Redis service endpoint"
      },
      {
        label: "Connect to Redis CLI",
        command: `kubectl exec -it deploy/${name}-${environment}-redis -n ${namespace} -- redis-cli`,
        description: "Open an interactive Redis CLI session"
      }
    ]
  };

  // Default commands for unknown blueprint types
  const defaultCommands = [
    {
      label: "Check pod status",
      command: `kubectl get pods -n ${namespace}`,
      description: "View pod status in the namespace"
    },
    {
      label: "View all resources",
      command: `kubectl get all -n ${namespace}`,
      description: "List all resources in the namespace"
    },
    {
      label: "View secrets",
      command: `kubectl get secrets -n ${namespace}`,
      description: "List available secrets"
    }
  ];

  return commands[blueprintId] || defaultCommands;
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy:", err);
    return false;
  }
}

/**
 * Component to display kubectl commands for Crossplane resources
 */
function CrossplaneCredentials({ blueprintId, name, environment }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!name || !environment) {
    return (
      <div className="crossplane-credentials-empty">
        <p>Resource details not available yet.</p>
      </div>
    );
  }

  const commands = generateKubectlCommands(blueprintId, name, environment);
  const namespace = `${name}-${environment}`;

  const handleCopy = async (command, index) => {
    const success = await copyToClipboard(command);
    if (success) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  return (
    <div className="crossplane-credentials">
      <div className="credentials-info">
        <span className="credentials-namespace">
          Namespace: <code>{namespace}</code>
        </span>
      </div>

      <div className="credentials-commands">
        {commands.map((cmd, index) => (
          <div key={index} className="command-item">
            <div className="command-header">
              <span className="command-label">{cmd.label}</span>
              <button
                className={`copy-btn ${copiedIndex === index ? "copied" : ""}`}
                onClick={() => handleCopy(cmd.command, index)}
                title="Copy to clipboard"
              >
                {copiedIndex === index ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="command-code">{cmd.command}</pre>
            {cmd.description && (
              <span className="command-description">{cmd.description}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CrossplaneCredentials;
