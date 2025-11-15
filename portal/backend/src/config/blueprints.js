// Blueprint catalog used by the API and GitHub provisioning.

export const BLUEPRINTS = [
  {
    id: "azure-rg-basic",
    displayName: "Azure Resource Group (basic)",
    description: "Creates a single Resource Group using a standardized naming convention.",
    moduleSource: "../../modules/azure-rg-basic",
    variables: [
      {
        name: "project_name",
        label: "Project Name",
        type: "string",
        required: true
      },
      {
        name: "environment",
        label: "Environment",
        type: "select",
        required: true,
        options: ["dev","prod"],
        default: "dev"
      },
      {
        name: "location",
        label: "Location",
        type: "string",
        required: true,
        default: "eastus2"
      }
    ]
  }
];

export function getBlueprintById(id) {
  return BLUEPRINTS.find((b) => b.id === id) || null;
}
