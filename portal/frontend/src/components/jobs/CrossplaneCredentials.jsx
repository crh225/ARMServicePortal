import React, { useState } from "react";
import "../../styles/CrossplaneCredentials.css";

/**
 * Generate kubectl commands based on blueprint type and configuration
 * Returns commands with both PowerShell and Bash variants
 */
function generateKubectlCommands(blueprintId, name, environment, crossplaneYaml) {
  const namespace = `${name}-${environment}`;

  // Helper to create command with both shell variants
  const cmd = (label, description, { powershell, bash }) => ({
    label,
    description,
    powershell: powershell || bash,
    bash: bash || powershell
  });

  // Base64 decode helpers
  const psBase64 = (secretName, key) =>
    `kubectl get secret ${secretName} -n ${namespace} -o jsonpath="{.data.${key}}" | % { [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($_)) }`;
  const bashBase64 = (secretName, key) =>
    `kubectl get secret ${secretName} -n ${namespace} -o jsonpath='{.data.${key}}' | base64 -d`;

  // Standalone RabbitMQ blueprint
  if (blueprintId === "xp-rabbitmq") {
    return [
      cmd("Get RabbitMQ username", "Decode the admin username", {
        powershell: psBase64(`${namespace}-rabbitmq-admin`, "username"),
        bash: bashBase64(`${namespace}-rabbitmq-admin`, "username")
      }),
      cmd("Get RabbitMQ password", "Decode the admin password", {
        powershell: psBase64(`${namespace}-rabbitmq-admin`, "password"),
        bash: bashBase64(`${namespace}-rabbitmq-admin`, "password")
      }),
      cmd("Get Management URL", "Get the external management UI URL", {
        powershell: `kubectl get ingress -n ${namespace} -o jsonpath="{.items[0].spec.rules[0].host}"`,
        bash: `kubectl get ingress -n ${namespace} -o jsonpath='{.items[0].spec.rules[0].host}'`
      }),
      cmd("Check pod status", "View RabbitMQ pod status", {
        bash: `kubectl get pods -n ${namespace}`
      })
    ];
  }

  // Standalone Redis blueprint
  if (blueprintId === "xp-redis") {
    return [
      cmd("Check Redis pod status", "View Redis pod status", {
        bash: `kubectl get pods -n ${namespace}`
      }),
      cmd("Get Redis service endpoint", "Get the internal Redis service endpoint", {
        powershell: `kubectl get svc -n ${namespace} -o jsonpath="{.items[0].metadata.name}:{.items[0].spec.ports[0].port}"`,
        bash: `kubectl get svc -n ${namespace} -o jsonpath='{.items[0].metadata.name}:{.items[0].spec.ports[0].port}'`
      }),
      cmd("Connect to Redis CLI", "Open an interactive Redis CLI session", {
        bash: `kubectl exec -it deploy/${namespace}-redis -n ${namespace} -- redis-cli`
      })
    ];
  }

  // ApplicationEnvironment blueprint - check YAML for enabled add-ons
  if (blueprintId === "xp-application-environment") {
    const commands = [
      cmd("Check pod status", "View all pods in the namespace", {
        bash: `kubectl get pods -n ${namespace}`
      }),
      cmd("Get database password", "Decode the PostgreSQL password", {
        powershell: psBase64(`${namespace}-db-credentials`, "password"),
        bash: bashBase64(`${namespace}-db-credentials`, "password")
      }),
      cmd("View ingress", "View ingress configuration", {
        bash: `kubectl get ingress -n ${namespace}`
      })
    ];

    // Check if Redis is enabled in the YAML
    const redisEnabled = crossplaneYaml && /redis:\s*\n\s+enabled:\s*true/i.test(crossplaneYaml);
    if (redisEnabled) {
      commands.push(
        cmd("Connect to Redis", "Open Redis CLI session", {
          bash: `kubectl exec -it deploy/${namespace}-redis -n ${namespace} -- redis-cli`
        })
      );
    }

    // Check if RabbitMQ is enabled in the YAML
    const rabbitmqEnabled = crossplaneYaml && /rabbitmq:\s*\n\s+enabled:\s*true/i.test(crossplaneYaml);
    if (rabbitmqEnabled) {
      commands.push(
        cmd("Get RabbitMQ credentials", "View RabbitMQ connection details", {
          bash: `kubectl get secret ${namespace}-rabbitmq-credentials -n ${namespace} -o yaml`
        })
      );
    }

    return commands;
  }

  // Default commands for other blueprint types
  return [
    cmd("Check pod status", "View pod status in the namespace", {
      bash: `kubectl get pods -n ${namespace}`
    }),
    cmd("View all resources", "List all resources in the namespace", {
      bash: `kubectl get all -n ${namespace}`
    }),
    cmd("View secrets", "List available secrets", {
      bash: `kubectl get secrets -n ${namespace}`
    })
  ];
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
function CrossplaneCredentials({ blueprintId, name, environment, crossplaneYaml }) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [shell, setShell] = useState("powershell");

  if (!name || !environment) {
    return (
      <div className="crossplane-credentials-empty">
        <p>Resource details not available yet.</p>
      </div>
    );
  }

  const commands = generateKubectlCommands(blueprintId, name, environment, crossplaneYaml);
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
        <div className="shell-toggle">
          <button
            className={`shell-btn ${shell === "powershell" ? "active" : ""}`}
            onClick={() => setShell("powershell")}
          >
            PowerShell
          </button>
          <button
            className={`shell-btn ${shell === "bash" ? "active" : ""}`}
            onClick={() => setShell("bash")}
          >
            Bash
          </button>
        </div>
      </div>

      <div className="credentials-commands">
        {commands.map((cmd, index) => {
          const command = shell === "powershell" ? cmd.powershell : cmd.bash;
          return (
            <div key={index} className="command-item">
              <div className="command-header">
                <span className="command-label">{cmd.label}</span>
                <button
                  className={`copy-btn ${copiedIndex === index ? "copied" : ""}`}
                  onClick={() => handleCopy(command, index)}
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
              <pre className="command-code">{command}</pre>
              {cmd.description && (
                <span className="command-description">{cmd.description}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CrossplaneCredentials;
