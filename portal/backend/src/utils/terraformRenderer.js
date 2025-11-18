/**
 * Render a Terraform module configuration with outputs
 */
export function renderTerraformModule({ moduleName, blueprint, variables }) {
  const lines = [
    `module "${moduleName}" {`,
    `  source       = "${blueprint.moduleSource}"`
  ];

  const allowedVarNames = (blueprint.variables || []).map((v) => v.name);

  for (const [k, v] of Object.entries(variables)) {
    if (!allowedVarNames.includes(k)) continue;
    const value = String(v).replace(/"/g, '\\"');
    lines.push(`  ${k} = "${value}"`);
  }

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
