/**
 * Sensitive data redaction utilities for Terraform code generation
 */

/**
 * List of sensitive property keys to redact
 */
const SENSITIVE_KEYS = [
  "password",
  "passwords",
  "secret",
  "secrets",
  "key",
  "keys",
  "connectionString",
  "connectionStrings",
  "accessKey",
  "accessKeys",
  "token",
  "tokens",
  "credential",
  "credentials",
  "privateKey",
  "certificatePassword",
  "adminPassword",
  "administratorLoginPassword"
];

/**
 * Check if a property key is sensitive
 * @param {string} key - Property key name
 * @returns {boolean} True if sensitive
 */
export function isSensitiveKey(key) {
  const lowerKey = key.toLowerCase();
  return SENSITIVE_KEYS.some(sensitiveKey => lowerKey.includes(sensitiveKey.toLowerCase()));
}

/**
 * Get placeholder for sensitive field
 * @param {string} key - Property key name
 * @returns {string} Placeholder value
 */
export function getSensitivePlaceholder(key) {
  const lowerKey = key.toLowerCase();

  // Return context-specific placeholders
  if (lowerKey.includes("password")) {
    return "****_UPDATE_PASSWORD_****";
  } else if (lowerKey.includes("secret")) {
    return "****_UPDATE_SECRET_****";
  } else if (lowerKey.includes("key") || lowerKey.includes("accesskey")) {
    return "****_UPDATE_KEY_****";
  } else if (lowerKey.includes("connectionstring")) {
    return "****_UPDATE_CONNECTION_STRING_****";
  } else if (lowerKey.includes("token")) {
    return "****_UPDATE_TOKEN_****";
  } else if (lowerKey.includes("credential")) {
    return "****_UPDATE_CREDENTIAL_****";
  } else if (lowerKey.includes("certificate")) {
    return "****_UPDATE_CERTIFICATE_****";
  }

  return "****_UPDATE_SENSITIVE_VALUE_****";
}

/**
 * Redact sensitive values from properties object
 * @param {object} properties - Azure resource properties
 * @returns {object} Properties with sensitive values redacted
 */
export function redactSensitiveProperties(properties) {
  if (!properties || typeof properties !== "object") {
    return properties;
  }

  const redacted = { ...properties };

  for (const [key, value] of Object.entries(redacted)) {
    if (isSensitiveKey(key)) {
      redacted[key] = getSensitivePlaceholder(key);
    } else if (typeof value === "object" && value !== null) {
      redacted[key] = redactSensitiveProperties(value);
    }
  }

  return redacted;
}
