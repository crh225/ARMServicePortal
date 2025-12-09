/**
 * Render a Terraform module configuration with outputs
 * Automatically adds ARM Portal tags for resource tracking
 */
export function renderTerraformModule({ moduleName, blueprint, variables, prNumber, owner }) {
  const lines = [
    `module "${moduleName}" {`,
  ];

  const allowedVarNames = (blueprint.variables || []).map((v) => v.name);

  // Collect all variable entries for alignment
  const varEntries = [];

  // Add source first
  varEntries.push({ key: 'source', value: `"${blueprint.moduleSource}"`, isReference: false });

  // Add regular variables
  for (const [k, v] of Object.entries(variables)) {
    if (!allowedVarNames.includes(k)) continue;
    const strValue = String(v);

    // Check if this is a Terraform reference (module output, variable, local, etc.)
    // Don't quote these - they need to be unquoted for Terraform to evaluate them
    const isTerraformReference = strValue.match(/^(module\.|var\.|local\.|data\.)/);

    if (isTerraformReference) {
      varEntries.push({ key: k, value: strValue, isReference: true });
    } else {
      const value = strValue.replace(/"/g, '\\"');
      varEntries.push({ key: k, value: `"${value}"`, isReference: false });
    }
  }

  // Calculate max key length for alignment
  const maxKeyLength = Math.max(...varEntries.map(e => e.key.length));

  // Add aligned variable lines
  varEntries.forEach(({ key, value }) => {
    const padding = ' '.repeat(maxKeyLength - key.length);
    lines.push(`  ${key}${padding} = ${value}`);
  });

  // Add ARM Portal tags for resource tracking
  lines.push("");
  lines.push("  # ARM Portal tracking tags");
  lines.push("  tags = {");
  lines.push(`    armportal-environment = "${variables.environment || 'dev'}"`);
  lines.push(`    armportal-blueprint   = "${blueprint.id}"`);
  lines.push(`    armportal-request-id  = "${prNumber || moduleName}"`);
  if (owner) {
    lines.push(`    armportal-owner       = "${owner}"`);
  }
  lines.push("  }");

  lines.push("}");

  // Add output blocks for each defined output
  if (blueprint.outputs && blueprint.outputs.length > 0) {
    lines.push("");  // Empty line before outputs
    blueprint.outputs.forEach(output => {
      lines.push(`output "${moduleName}_${output.name}" {`);
      lines.push(`  value       = module.${moduleName}.${output.name}`);
      if (output.description) {
        lines.push(`  description = "${output.description}"`);
      }
      // Mark output as sensitive if:
      // 1. Output has sensitive: true property, OR
      // 2. Description contains "(sensitive)" keyword
      if (output.sensitive || (output.description && output.description.toLowerCase().includes("sensitive"))) {
        lines.push(`  sensitive   = true`);
      }
      lines.push("}");
    });
  }

  return lines.join("\n");
}
