/**
 * Render a Terraform module configuration with outputs
 * Automatically adds ARM Portal tags for resource tracking
 */
export function renderTerraformModule({ moduleName, blueprint, variables, prNumber, owner }) {
  const lines = [
    `module "${moduleName}" {`,
    `  source       = "${blueprint.moduleSource}"`
  ];

  const allowedVarNames = (blueprint.variables || []).map((v) => v.name);

  // Add regular variables
  for (const [k, v] of Object.entries(variables)) {
    if (!allowedVarNames.includes(k)) continue;
    const strValue = String(v);

    // Check if this is a Terraform reference (module output, variable, local, etc.)
    // Don't quote these - they need to be unquoted for Terraform to evaluate them
    const isTerraformReference = strValue.match(/^(module\.|var\.|local\.|data\.)/);

    if (isTerraformReference) {
      lines.push(`  ${k} = ${strValue}`);
    } else {
      const value = strValue.replace(/"/g, '\\"');
      lines.push(`  ${k} = "${value}"`);
    }
  }

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
      lines.push("}");
    });
  }

  return lines.join("\n");
}
