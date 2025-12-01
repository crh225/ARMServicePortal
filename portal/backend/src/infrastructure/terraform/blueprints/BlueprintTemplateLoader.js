/**
 * Blueprint template loading and parsing utilities
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load blueprint template from module directory
 * Checks: MODULES_PATH env var, /app/modules (Docker), or infra/modules (local dev)
 * @param {string} blueprintId - Blueprint ID
 * @returns {string|null} Template content or null if not found
 */
export function loadBlueprintTemplate(blueprintId) {
  const searchPaths = [
    process.env.MODULES_PATH && path.join(process.env.MODULES_PATH, blueprintId, "main.tf"),
    "/app/modules/" + blueprintId + "/main.tf",
    path.join(__dirname, "..", "..", "..", "..", "..", "..", "infra", "modules", blueprintId, "main.tf"),
  ].filter(Boolean);

  for (const modulePath of searchPaths) {
    try {
      if (fs.existsSync(modulePath)) {
        console.log(`[BlueprintTemplateLoader] Loaded template from: ${modulePath}`);
        return fs.readFileSync(modulePath, "utf8");
      }
    } catch (error) {
      // Continue to next path
    }
  }

  console.warn(`[BlueprintTemplateLoader] No template found for: ${blueprintId}`);
  return null;
}

/**
 * Extract variable definitions from blueprint template
 * @param {string} template - Blueprint template content
 * @returns {Array} Array of variable definitions with name, type, and default
 */
export function extractBlueprintVariables(template) {
  const variables = [];
  const variableRegex = /variable\s+"([^"]+)"\s*\{[^}]*type\s*=\s*([^\n]+)[^}]*(?:default\s*=\s*([^\n}]+))?[^}]*\}/g;

  let match;
  while ((match = variableRegex.exec(template)) !== null) {
    const [, name, type, defaultValue] = match;
    variables.push({
      name: name.trim(),
      type: type.trim(),
      default: defaultValue ? defaultValue.trim() : null
    });
  }

  return variables;
}
