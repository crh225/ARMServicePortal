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
 * @param {string} blueprintId - Blueprint ID
 * @returns {string|null} Template content or null if not found
 */
export function loadBlueprintTemplate(blueprintId) {
  try {
    // Navigate from backend/src/infrastructure/terraform/blueprints to infra/modules
    const modulePath = path.join(__dirname, "..", "..", "..", "..", "..", "..", "infra", "modules", blueprintId, "main.tf");

    if (fs.existsSync(modulePath)) {
      return fs.readFileSync(modulePath, "utf8");
    }
  } catch (error) {
    console.error(`Failed to load blueprint template for ${blueprintId}:`, error);
  }

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
