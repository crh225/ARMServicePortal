import { describe, it, expect } from "vitest";
import { parseTerraformVariables, initializeFormValues, parsePolicyErrors } from "./terraformParser";

describe("terraformParser", () => {
  describe("parseTerraformVariables", () => {
    it("parses variables with quoted string values", () => {
      const terraformModule = `
        resource_group_name = "my-rg"
        location = "eastus"
      `;

      const result = parseTerraformVariables(terraformModule);

      expect(result).toEqual({
        resource_group_name: "my-rg",
        location: "eastus"
      });
    });

    it("parses variables with unquoted values", () => {
      const terraformModule = `
        count = 5
        enabled = true
      `;

      const result = parseTerraformVariables(terraformModule);

      expect(result).toEqual({
        count: "5",
        enabled: "true"
      });
    });

    it("parses mix of quoted and unquoted values", () => {
      const terraformModule = `
        name = "storage-account"
        sku = "Standard_LRS"
        tier = Premium
        replicas = 3
      `;

      const result = parseTerraformVariables(terraformModule);

      expect(result).toEqual({
        name: "storage-account",
        sku: "Standard_LRS",
        tier: "Premium",
        replicas: "3"
      });
    });

    it("handles variables with spaces around equals sign", () => {
      const terraformModule = `
        var1="value1"
        var2 ="value2"
        var3= "value3"
        var4  =  "value4"
      `;

      const result = parseTerraformVariables(terraformModule);

      expect(result).toEqual({
        var1: "value1",
        var2: "value2",
        var3: "value3",
        var4: "value4"
      });
    });

    it("parses empty string values", () => {
      const terraformModule = `
        empty_var = ""
        normal_var = "value"
      `;

      const result = parseTerraformVariables(terraformModule);

      expect(result).toEqual({
        empty_var: "",
        normal_var: "value"
      });
    });

    it("handles variables with underscores and numbers in names", () => {
      const terraformModule = `
        vm_count_2 = "3"
        storage_v2_name = "myStorage"
      `;

      const result = parseTerraformVariables(terraformModule);

      expect(result).toEqual({
        vm_count_2: "3",
        storage_v2_name: "myStorage"
      });
    });

    it("overwrites duplicate variable names with last value", () => {
      const terraformModule = `
        location = "eastus"
        location = "westus"
      `;

      const result = parseTerraformVariables(terraformModule);

      expect(result).toEqual({
        location: "westus"
      });
    });

    it("handles multi-line terraform code", () => {
      const terraformModule = `
        resource "azurerm_resource_group" "example" {
          name     = "example-rg"
          location = "East US"
        }

        variable "environment" {
          default = "dev"
        }

        tags = {
          Environment = "Development"
        }
      `;

      const result = parseTerraformVariables(terraformModule);

      // Should parse the assignments it can recognize
      expect(result.name).toBe("example-rg");
      expect(result.location).toBe("East");
      expect(result.default).toBe("dev");
    });

    it("returns empty object for null input", () => {
      const result = parseTerraformVariables(null);

      expect(result).toEqual({});
    });

    it("returns empty object for undefined input", () => {
      const result = parseTerraformVariables(undefined);

      expect(result).toEqual({});
    });

    it("returns empty object for empty string", () => {
      const result = parseTerraformVariables("");

      expect(result).toEqual({});
    });

    it("returns empty object when no variables match pattern", () => {
      const terraformModule = `
        This is just some text
        without any variables
      `;

      const result = parseTerraformVariables(terraformModule);

      expect(result).toEqual({});
    });

    it("handles special characters in quoted values", () => {
      const terraformModule = `
        name = "my-storage@account#123"
        path = "/var/log/app.log"
      `;

      const result = parseTerraformVariables(terraformModule);

      expect(result).toEqual({
        name: "my-storage@account#123",
        path: "/var/log/app.log"
      });
    });

    it("parses variables on same line separated by newline", () => {
      const terraformModule = "var1 = \"val1\"\nvar2 = \"val2\"\nvar3 = \"val3\"";

      const result = parseTerraformVariables(terraformModule);

      expect(result).toEqual({
        var1: "val1",
        var2: "val2",
        var3: "val3"
      });
    });
  });

  describe("initializeFormValues", () => {
    it("initializes form values from blueprint variables with defaults", () => {
      const blueprint = {
        id: "test-blueprint",
        variables: [
          { name: "resource_group_name", type: "string", default: "my-rg" },
          { name: "location", type: "select", default: "eastus" },
          { name: "sku", type: "string", default: "Standard_LRS" }
        ]
      };

      const result = initializeFormValues(blueprint);

      expect(result).toEqual({
        resource_group_name: "my-rg",
        location: "eastus",
        sku: "Standard_LRS"
      });
    });

    it("uses empty string for variables without defaults", () => {
      const blueprint = {
        id: "test-blueprint",
        variables: [
          { name: "name", type: "string" },
          { name: "location", type: "string" }
        ]
      };

      const result = initializeFormValues(blueprint);

      expect(result).toEqual({
        name: "",
        location: ""
      });
    });

    it("handles mix of variables with and without defaults", () => {
      const blueprint = {
        id: "test-blueprint",
        variables: [
          { name: "name", type: "string", default: "test-name" },
          { name: "location", type: "string" },
          { name: "enabled", type: "boolean", default: true }
        ]
      };

      const result = initializeFormValues(blueprint);

      expect(result).toEqual({
        name: "test-name",
        location: "",
        enabled: true
      });
    });

    it("handles numeric defaults", () => {
      const blueprint = {
        id: "test-blueprint",
        variables: [
          { name: "count", type: "number", default: 3 },
          { name: "port", type: "number", default: 443 }
        ]
      };

      const result = initializeFormValues(blueprint);

      expect(result).toEqual({
        count: 3,
        port: 443
      });
    });

    it("handles boolean defaults", () => {
      const blueprint = {
        id: "test-blueprint",
        variables: [
          { name: "enabled", type: "boolean", default: true },
          { name: "debug", type: "boolean", default: false }
        ]
      };

      const result = initializeFormValues(blueprint);

      expect(result).toEqual({
        enabled: true,
        debug: false
      });
    });

    it("handles default value of 0 and false correctly", () => {
      const blueprint = {
        id: "test-blueprint",
        variables: [
          { name: "count", type: "number", default: 0 },
          { name: "enabled", type: "boolean", default: false }
        ]
      };

      const result = initializeFormValues(blueprint);

      expect(result).toEqual({
        count: 0,
        enabled: false
      });
    });

    it("returns empty object for null blueprint", () => {
      const result = initializeFormValues(null);

      expect(result).toEqual({});
    });

    it("returns empty object for undefined blueprint", () => {
      const result = initializeFormValues(undefined);

      expect(result).toEqual({});
    });

    it("returns empty object for blueprint without variables", () => {
      const blueprint = {
        id: "test-blueprint",
        displayName: "Test Blueprint"
      };

      const result = initializeFormValues(blueprint);

      expect(result).toEqual({});
    });

    it("returns empty object for blueprint with null variables", () => {
      const blueprint = {
        id: "test-blueprint",
        variables: null
      };

      const result = initializeFormValues(blueprint);

      expect(result).toEqual({});
    });

    it("returns empty object for blueprint with empty variables array", () => {
      const blueprint = {
        id: "test-blueprint",
        variables: []
      };

      const result = initializeFormValues(blueprint);

      expect(result).toEqual({});
    });

    it("handles variables with complex default objects", () => {
      const blueprint = {
        id: "test-blueprint",
        variables: [
          { name: "tags", type: "object", default: { env: "dev", team: "platform" } },
          { name: "options", type: "array", default: ["opt1", "opt2"] }
        ]
      };

      const result = initializeFormValues(blueprint);

      expect(result).toEqual({
        tags: { env: "dev", team: "platform" },
        options: ["opt1", "opt2"]
      });
    });
  });

  describe("parsePolicyErrors", () => {
    it("parses valid JSON with policyErrors", () => {
      const errorMessage = JSON.stringify({
        error: "Policy validation failed",
        policyErrors: [
          { field: "location", message: "Location not allowed" },
          { field: "name", message: "Name must match pattern" }
        ]
      });

      const result = parsePolicyErrors(errorMessage);

      expect(result).toEqual([
        { field: "location", message: "Location not allowed" },
        { field: "name", message: "Name must match pattern" }
      ]);
    });

    it("returns null when JSON has no policyErrors property", () => {
      const errorMessage = JSON.stringify({
        error: "Some error",
        details: "Error details"
      });

      const result = parsePolicyErrors(errorMessage);

      expect(result).toBeNull();
    });

    it("returns null for invalid JSON", () => {
      const errorMessage = "This is not valid JSON {";

      const result = parsePolicyErrors(errorMessage);

      expect(result).toBeNull();
    });

    it("returns null for plain text error message", () => {
      const errorMessage = "Something went wrong";

      const result = parsePolicyErrors(errorMessage);

      expect(result).toBeNull();
    });

    it("returns null for null input", () => {
      const result = parsePolicyErrors(null);

      expect(result).toBeNull();
    });

    it("returns null for undefined input", () => {
      const result = parsePolicyErrors(undefined);

      expect(result).toBeNull();
    });

    it("returns null for empty string", () => {
      const result = parsePolicyErrors("");

      expect(result).toBeNull();
    });

    it("handles empty policyErrors array", () => {
      const errorMessage = JSON.stringify({
        error: "Policy validation failed",
        policyErrors: []
      });

      const result = parsePolicyErrors(errorMessage);

      expect(result).toEqual([]);
    });

    it("handles policyErrors with additional properties", () => {
      const errorMessage = JSON.stringify({
        error: "Policy validation failed",
        policyErrors: [
          { field: "location", message: "Invalid", severity: "error", code: "POL001" }
        ],
        policyWarnings: [
          { field: "name", message: "Warning", severity: "warning" }
        ]
      });

      const result = parsePolicyErrors(errorMessage);

      expect(result).toEqual([
        { field: "location", message: "Invalid", severity: "error", code: "POL001" }
      ]);
    });

    it("handles nested JSON structures", () => {
      const errorMessage = JSON.stringify({
        error: {
          message: "Validation failed",
          code: 400
        },
        policyErrors: [
          {
            field: "tags",
            message: "Required tags missing",
            details: {
              required: ["env", "team"],
              missing: ["team"]
            }
          }
        ]
      });

      const result = parsePolicyErrors(errorMessage);

      expect(result).toEqual([
        {
          field: "tags",
          message: "Required tags missing",
          details: {
            required: ["env", "team"],
            missing: ["team"]
          }
        }
      ]);
    });

    it("returns null when policyErrors is null", () => {
      const errorMessage = JSON.stringify({
        error: "Error",
        policyErrors: null
      });

      const result = parsePolicyErrors(errorMessage);

      expect(result).toBeNull();
    });

    it("returns null when policyErrors is undefined in object", () => {
      const errorMessage = JSON.stringify({
        error: "Error",
        policyErrors: undefined
      });

      const result = parsePolicyErrors(errorMessage);

      expect(result).toBeNull();
    });
  });
});
