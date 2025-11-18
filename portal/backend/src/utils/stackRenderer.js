import { getBlueprintById } from "../config/blueprints.js";
import { renderTerraformModule } from "./terraformRenderer.js";

/**
 * Check if a blueprint is a stack
 */
export function isStack(blueprint) {
  return blueprint.type === "stack" && blueprint.components;
}

/**
 * Resolve variable references in stack component variables
 * Supports: ${stack.var_name} and ${component_id.output_name}
 */
function resolveVariableReferences(value, stackVars, componentOutputs) {
  if (typeof value !== "string") return value;

  let resolved = value;

  // Resolve ${stack.variable_name} references
  resolved = resolved.replace(/\$\{stack\.([^}]+)\}/g, (match, varName) => {
    return stackVars[varName] || match;
  });

  // Resolve ${component_id.output_name} references
  resolved = resolved.replace(/\$\{([^.]+)\.([^}]+)\}/g, (match, componentId, outputName) => {
    if (componentOutputs[componentId] && componentOutputs[componentId][outputName]) {
      return componentOutputs[componentId][outputName];
    }
    return match;
  });

  return resolved;
}

/**
 * Expand a stack blueprint into multiple Terraform modules
 * Returns an array of module configurations
 */
export function expandStack(stack, stackVariables, baseModuleName) {
  if (!isStack(stack)) {
    throw new Error(`Blueprint ${stack.id} is not a stack`);
  }

  const modules = [];
  const componentOutputs = {};

  // Process each component in order
  stack.components.forEach((component, index) => {
    // Get the component blueprint
    const componentBlueprint = getBlueprintById(component.blueprint);
    if (!componentBlueprint) {
      throw new Error(`Component blueprint ${component.blueprint} not found`);
    }

    // Resolve variable values
    const resolvedVariables = {};
    for (const [key, value] of Object.entries(component.variables)) {
      resolvedVariables[key] = resolveVariableReferences(value, stackVariables, componentOutputs);
    }

    // Generate module name: stack_moduleName_componentId
    const moduleName = `${baseModuleName}_${component.id}`;

    // Track outputs for this component (for reference resolution)
    componentOutputs[component.id] = {};
    if (componentBlueprint.outputs) {
      componentBlueprint.outputs.forEach(output => {
        // Output will be: module.moduleName.output_name
        componentOutputs[component.id][output.name] = `module.${moduleName}.${output.name}`;
      });
    }

    modules.push({
      componentId: component.id,
      moduleName,
      blueprint: componentBlueprint,
      variables: resolvedVariables,
      dependsOn: component.dependsOn || []
    });
  });

  return modules;
}

/**
 * Render a stack as Terraform configuration
 * Returns the complete Terraform code for all modules in the stack
 */
export function renderStackTerraform(stack, stackVariables, baseModuleName) {
  const modules = expandStack(stack, stackVariables, baseModuleName);
  const terraformBlocks = [];

  modules.forEach(module => {
    const terraformCode = renderTerraformModule({
      moduleName: module.moduleName,
      blueprint: module.blueprint,
      variables: module.variables
    });
    terraformBlocks.push(terraformCode);
  });

  return terraformBlocks.join("\n\n");
}

/**
 * Get aggregated outputs for a stack
 * Maps stack output definitions to actual module outputs
 */
export function getStackOutputs(stack, baseModuleName) {
  if (!isStack(stack)) {
    return [];
  }

  return stack.outputs.map(output => {
    // Parse source: "componentId.outputName"
    const [componentId, outputName] = output.source.split(".");
    const moduleName = `${baseModuleName}_${componentId}`;

    return {
      name: output.name,
      description: output.description,
      moduleOutput: `${moduleName}_${outputName}`
    };
  });
}
