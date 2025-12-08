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
 * Reads all .tf files in the module directory and concatenates them
 * Checks: MODULES_PATH env var, /app/modules (Docker), or infra/modules (local dev)
 * @param {string} blueprintId - Blueprint ID
 * @returns {string|null} Template content or null if not found
 */
export function loadBlueprintTemplate(blueprintId) {
  const searchDirs = [
    process.env.MODULES_PATH && path.join(process.env.MODULES_PATH, blueprintId),
    "/app/modules/" + blueprintId,
    path.join(__dirname, "..", "..", "..", "..", "..", "..", "infra", "modules", blueprintId),
  ].filter(Boolean);

  for (const moduleDir of searchDirs) {
    try {
      if (fs.existsSync(moduleDir) && fs.statSync(moduleDir).isDirectory()) {
        // Read all .tf files in the directory
        const tfFiles = fs.readdirSync(moduleDir)
          .filter(file => file.endsWith('.tf'))
          .sort(); // Sort for consistent ordering

        if (tfFiles.length === 0) continue;

        // Concatenate all .tf file contents
        const contents = tfFiles.map(file => {
          const filePath = path.join(moduleDir, file);
          return fs.readFileSync(filePath, "utf8");
        }).join("\n\n");

        console.log(`[BlueprintTemplateLoader] Loaded ${tfFiles.length} .tf files from: ${moduleDir}`);
        return contents;
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
