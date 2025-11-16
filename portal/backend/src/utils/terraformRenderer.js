/**
 * Render a Terraform module configuration
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
  return lines.join("\n");
}
