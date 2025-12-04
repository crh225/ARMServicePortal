import React, { useState } from "react";
import "../../styles/CrossplaneCredentials.css";

/**
 * Parse building blocks YAML to determine which components are enabled
 */
function parseBuildingBlocksComponents(crossplaneYaml) {
  if (!crossplaneYaml) return {};

  const components = {
    redis: false,
    rabbitmq: false,
    postgres: false,
    backend: false,
    frontend: false,
    ingress: false
  };

  // Check for each claim type in the multi-document YAML
  if (/kind:\s*RedisClaim/i.test(crossplaneYaml)) components.redis = true;
  if (/kind:\s*RabbitMQClaim/i.test(crossplaneYaml)) components.rabbitmq = true;
  if (/kind:\s*PostgresClaim/i.test(crossplaneYaml)) components.postgres = true;
  if (/kind:\s*BackendClaim/i.test(crossplaneYaml)) components.backend = true;
  if (/kind:\s*FrontendClaim/i.test(crossplaneYaml)) components.frontend = true;
  if (/kind:\s*IngressClaim/i.test(crossplaneYaml)) components.ingress = true;

  // Extract specific resource names from claims
  const redisNameMatch = crossplaneYaml.match(/kind:\s*RedisClaim[\s\S]*?name:\s*["']?([a-z0-9-]+)["']?/);
  const rabbitNameMatch = crossplaneYaml.match(/kind:\s*RabbitMQClaim[\s\S]*?name:\s*["']?([a-z0-9-]+)["']?/);
  const postgresNameMatch = crossplaneYaml.match(/kind:\s*PostgresClaim[\s\S]*?name:\s*["']?([a-z0-9-]+)["']?/);
  const backendNameMatch = crossplaneYaml.match(/kind:\s*BackendClaim[\s\S]*?name:\s*["']?([a-z0-9-]+)["']?/);
  const frontendNameMatch = crossplaneYaml.match(/kind:\s*FrontendClaim[\s\S]*?name:\s*["']?([a-z0-9-]+)["']?/);

  // Extract RabbitMQ management configuration
  const rabbitMgmtEnabled = /exposeManagement:\s*true/i.test(crossplaneYaml);
  const rabbitMgmtHostMatch = crossplaneYaml.match(/managementHost:\s*["']?([a-z0-9.-]+)["']?/i);

  return {
    ...components,
    redisName: redisNameMatch ? redisNameMatch[1] : null,
    rabbitName: rabbitNameMatch ? rabbitNameMatch[1] : null,
    postgresName: postgresNameMatch ? postgresNameMatch[1] : null,
    backendName: backendNameMatch ? backendNameMatch[1] : null,
    frontendName: frontendNameMatch ? frontendNameMatch[1] : null,
    rabbitMgmtEnabled,
    rabbitMgmtHost: rabbitMgmtHostMatch ? rabbitMgmtHostMatch[1] : null
  };
}

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

  // Building blocks blueprint - modular components
  if (blueprintId === "xp-building-blocks") {
    const components = parseBuildingBlocksComponents(crossplaneYaml);
    const commands = [
      cmd("Check all pods", "View all pods in the namespace", {
        bash: `kubectl get pods -n ${namespace}`
      }),
      cmd("View all services", "List all services and their endpoints", {
        bash: `kubectl get svc -n ${namespace}`
      }),
      cmd("View all secrets", "List available secrets", {
        bash: `kubectl get secrets -n ${namespace}`
      })
    ];

    // Redis commands
    if (components.redis) {
      const redisService = components.redisName || `${name}-cache`;
      commands.push(
        cmd("Redis connection URL", "Get the Redis connection URL for your application", {
          powershell: psBase64(`${redisService}-credentials`, "url"),
          bash: bashBase64(`${redisService}-credentials`, "url")
        }),
        cmd("Connect to Redis CLI", "Open an interactive Redis CLI session", {
          bash: `kubectl exec -it deploy/${redisService} -n ${namespace} -- redis-cli`
        })
      );
    }

    // RabbitMQ commands
    if (components.rabbitmq) {
      const rabbitService = components.rabbitName || `${name}-mq`;
      commands.push(
        cmd("RabbitMQ connection URL", "Get the AMQP connection URL for your application", {
          powershell: psBase64(`${rabbitService}-credentials`, "url"),
          bash: bashBase64(`${rabbitService}-credentials`, "url")
        }),
        cmd("RabbitMQ username", "Decode the admin username", {
          powershell: psBase64(`${rabbitService}-credentials`, "username"),
          bash: bashBase64(`${rabbitService}-credentials`, "username")
        }),
        cmd("RabbitMQ password", "Decode the admin password", {
          powershell: psBase64(`${rabbitService}-credentials`, "password"),
          bash: bashBase64(`${rabbitService}-credentials`, "password")
        })
      );

      // Management UI commands
      if (components.rabbitMgmtEnabled) {
        if (components.rabbitMgmtHost) {
          // External ingress is configured
          const mgmtUrl = `https://${components.rabbitMgmtHost}`;
          commands.push(
            cmd("Open Management UI", "Open RabbitMQ management console in browser", {
              powershell: `Start-Process "${mgmtUrl}"`,
              bash: `open "${mgmtUrl}" || xdg-open "${mgmtUrl}"`
            }),
            cmd("Management UI URL", "Copy the management UI URL", {
              powershell: `Write-Host "${mgmtUrl}"`,
              bash: `echo "${mgmtUrl}"`
            }),
            cmd("Login to Management UI", "Get credentials and open management UI", {
              powershell: `$user = ${psBase64(`${rabbitService}-credentials`, "username")}; $pass = ${psBase64(`${rabbitService}-credentials`, "password")}; Write-Host "Username: $user"; Write-Host "Password: $pass"; Write-Host "URL: ${mgmtUrl}"; Start-Process "${mgmtUrl}"`,
              bash: `echo "Username: $(${bashBase64(`${rabbitService}-credentials`, "username")})"; echo "Password: $(${bashBase64(`${rabbitService}-credentials`, "password")})"; echo "URL: ${mgmtUrl}"`
            })
          );
        } else {
          // Management enabled but no external ingress - use port-forward
          commands.push(
            cmd("Port-forward Management UI", "Forward local port 15672 to RabbitMQ management", {
              bash: `kubectl port-forward svc/${rabbitService} 15672:15672 -n ${namespace}`
            }),
            cmd("Open Management UI (local)", "Open http://localhost:15672 after port-forward", {
              powershell: `Start-Process "http://localhost:15672"`,
              bash: `open "http://localhost:15672" || xdg-open "http://localhost:15672"`
            }),
            cmd("Login to Management UI", "Get credentials for management UI login", {
              powershell: `$user = ${psBase64(`${rabbitService}-credentials`, "username")}; $pass = ${psBase64(`${rabbitService}-credentials`, "password")}; Write-Host "Username: $user"; Write-Host "Password: $pass"; Write-Host "URL: http://localhost:15672"`,
              bash: `echo "Username: $(${bashBase64(`${rabbitService}-credentials`, "username")})"; echo "Password: $(${bashBase64(`${rabbitService}-credentials`, "password")})"; echo "URL: http://localhost:15672"`
            })
          );
        }
      }
    }

    // PostgreSQL commands
    if (components.postgres) {
      const pgService = components.postgresName || `${name}-db`;
      commands.push(
        cmd("PostgreSQL connection URL", "Get the PostgreSQL connection URL", {
          powershell: psBase64(`${pgService}-credentials`, "url"),
          bash: bashBase64(`${pgService}-credentials`, "url")
        }),
        cmd("PostgreSQL password", "Decode the database password", {
          powershell: psBase64(`${pgService}-credentials`, "password"),
          bash: bashBase64(`${pgService}-credentials`, "password")
        }),
        cmd("Connect to PostgreSQL", "Open an interactive psql session", {
          bash: `kubectl exec -it deploy/${pgService} -n ${namespace} -- psql -U postgres`
        })
      );
    }

    // Backend commands
    if (components.backend) {
      const backendService = components.backendName || `${name}-backend`;
      commands.push(
        cmd("View backend logs", "Stream logs from the backend service", {
          bash: `kubectl logs -f deploy/${backendService} -n ${namespace}`
        }),
        cmd("Backend pod details", "View backend pod status and events", {
          bash: `kubectl describe pod -l app=${backendService} -n ${namespace}`
        })
      );
    }

    // Frontend commands
    if (components.frontend) {
      const frontendService = components.frontendName || `${name}-frontend`;
      commands.push(
        cmd("View frontend logs", "Stream logs from the frontend service", {
          bash: `kubectl logs -f deploy/${frontendService} -n ${namespace}`
        })
      );
    }

    // Ingress commands
    if (components.ingress) {
      commands.push(
        cmd("View ingress", "View ingress configuration and hosts", {
          bash: `kubectl get ingress -n ${namespace}`
        }),
        cmd("Get ingress host", "Get the external hostname", {
          powershell: `kubectl get ingress -n ${namespace} -o jsonpath="{.items[0].spec.rules[0].host}"`,
          bash: `kubectl get ingress -n ${namespace} -o jsonpath='{.items[0].spec.rules[0].host}'`
        })
      );
    }

    return commands;
  }

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
