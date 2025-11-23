import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

/**
 * Custom render function that wraps components with common providers
 */
export function renderWithRouter(ui, options = {}) {
  return render(ui, {
    wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
    ...options
  });
}

/**
 * Mock blueprint for testing
 */
export const mockBlueprint = {
  id: "azure-rg-basic",
  name: "Basic Resource Group",
  description: "Creates a basic Azure resource group",
  category: "infrastructure",
  estimatedCost: "$0.00/month",
  parameters: {
    name: {
      type: "string",
      description: "Resource group name",
      required: true,
      pattern: "^[a-zA-Z0-9-_]+$"
    },
    location: {
      type: "select",
      description: "Azure region",
      required: true,
      options: [
        { value: "eastus", label: "East US" },
        { value: "westus", label: "West US" },
        { value: "centralus", label: "Central US" }
      ]
    }
  }
};

/**
 * Mock resource for testing
 */
export const mockResource = {
  id: "/subscriptions/sub-123/resourceGroups/test-rg/providers/Microsoft.Storage/storageAccounts/teststorage",
  name: "teststorage",
  type: "Microsoft.Storage/storageAccounts",
  resourceGroup: "test-rg",
  subscriptionId: "sub-123",
  location: "eastus",
  environment: "dev",
  blueprintId: "azure-storage-basic",
  owner: "test-user",
  ownershipStatus: "owned",
  cost: 1.23
};

/**
 * Mock subscriptions for testing
 */
export const mockSubscriptions = [
  {
    id: "sub-123",
    name: "Azure subscription 1",
    state: "Enabled",
    tenantId: "tenant-123"
  },
  {
    id: "sub-456",
    name: "Azure subscription 2",
    state: "Enabled",
    tenantId: "tenant-456"
  }
];
