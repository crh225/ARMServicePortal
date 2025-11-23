import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BlueprintForm from "./BlueprintForm";
import * as resourcesApi from "../../services/resourcesApi";

// Mock the resourcesApi
vi.mock("../../services/resourcesApi", () => ({
  fetchResourceGroups: vi.fn()
}));

// Mock environment config
vi.mock("../../config/environmentConfig", () => ({
  getEnvironmentConfig: vi.fn((env) => {
    if (env === "prod") {
      return {
        level: "danger",
        title: "Production Environment",
        message: "This deployment will affect production resources. Proceed with caution."
      };
    }
    return null;
  })
}));

describe("BlueprintForm", () => {
  const mockBlueprint = {
    id: "azure-rg-basic",
    displayName: "Basic Resource Group",
    description: "Creates a basic Azure resource group",
    variables: [
      {
        name: "resource_group_name",
        label: "Resource Group Name",
        type: "string",
        required: true
      },
      {
        name: "location",
        label: "Location",
        type: "select",
        required: true,
        options: ["eastus", "westus", "centralus"]
      },
      {
        name: "environment",
        label: "Environment",
        type: "select",
        required: true,
        options: ["dev", "staging", "prod"]
      }
    ]
  };

  const defaultProps = {
    blueprint: mockBlueprint,
    formValues: {},
    onChange: vi.fn(),
    onSubmit: vi.fn(),
    loading: false,
    isUpdating: false,
    policyErrors: null,
    onClearSelection: vi.fn(),
    hasResult: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resourcesApi.fetchResourceGroups.mockResolvedValue(["test-rg-1", "test-rg-2"]);
  });

  it("renders blueprint title and description", () => {
    render(<BlueprintForm {...defaultProps} />);

    expect(screen.getByText("Basic Resource Group")).toBeInTheDocument();
    expect(screen.getByText("Creates a basic Azure resource group")).toBeInTheDocument();
  });

  it("renders all form fields based on blueprint variables", () => {
    render(<BlueprintForm {...defaultProps} />);

    expect(screen.getByText(/Resource Group Name/i)).toBeInTheDocument();
    expect(screen.getByText(/Location/i)).toBeInTheDocument();
    expect(screen.getByText(/Environment/i)).toBeInTheDocument();

    // Verify the form controls exist
    const inputs = screen.getAllByRole('combobox');
    expect(inputs.length).toBeGreaterThanOrEqual(2); // Location and Environment selects
  });

  it("displays required asterisk for required fields", () => {
    render(<BlueprintForm {...defaultProps} />);

    const requiredMarkers = screen.getAllByText("*");
    expect(requiredMarkers).toHaveLength(3); // All fields are required
  });

  it("calls onChange when input value changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    // Use a blueprint without resource_group_name to ensure we get a text input
    const blueprintWithTextInput = {
      ...mockBlueprint,
      variables: [
        {
          name: "custom_field",
          label: "Custom Field",
          type: "string",
          required: true
        }
      ]
    };

    render(<BlueprintForm {...defaultProps} blueprint={blueprintWithTextInput} onChange={onChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, "test");

    expect(onChange).toHaveBeenCalled();
  });

  it("calls onChange when select value changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<BlueprintForm {...defaultProps} onChange={onChange} />);

    const selects = screen.getAllByRole('combobox');
    const locationSelect = selects.find(select =>
      select.querySelector('option[value="eastus"]')
    );

    await user.selectOptions(locationSelect, "eastus");

    expect(onChange).toHaveBeenCalledWith("location", "eastus");
  });

  it("displays environment warning for production environment", () => {
    const propsWithProd = {
      ...defaultProps,
      formValues: { environment: "prod" }
    };

    render(<BlueprintForm {...propsWithProd} />);

    expect(screen.getByText("Production Environment")).toBeInTheDocument();
    expect(screen.getByText(/This deployment will affect production resources/i)).toBeInTheDocument();
  });

  it("displays policy errors when present", () => {
    const propsWithErrors = {
      ...defaultProps,
      policyErrors: [
        { field: "resource_group_name", message: "Name must not contain special characters" },
        { field: "location", message: "Location not allowed in this environment" }
      ]
    };

    render(<BlueprintForm {...propsWithErrors} />);

    expect(screen.getByText("Policy Violations")).toBeInTheDocument();
    expect(screen.getByText(/Name must not contain special characters/i)).toBeInTheDocument();
    expect(screen.getByText(/Location not allowed in this environment/i)).toBeInTheDocument();
  });

  it("shows 'Start Over' button when onClearSelection is provided", () => {
    render(<BlueprintForm {...defaultProps} />);

    expect(screen.getByText("← Start Over")).toBeInTheDocument();
  });

  it("shows 'Create Blueprint' button when hasResult is true", () => {
    const propsWithResult = {
      ...defaultProps,
      hasResult: true
    };

    render(<BlueprintForm {...propsWithResult} />);

    expect(screen.getByText("Create Blueprint")).toBeInTheDocument();
  });

  it("calls onClearSelection when Start Over button is clicked", async () => {
    const user = userEvent.setup();
    const onClearSelection = vi.fn();

    render(<BlueprintForm {...defaultProps} onClearSelection={onClearSelection} />);

    const button = screen.getByText("← Start Over");
    await user.click(button);

    expect(onClearSelection).toHaveBeenCalledWith(null);
  });

  it("fetches resource groups when environment changes", async () => {
    const { rerender } = render(
      <BlueprintForm {...defaultProps} formValues={{ environment: "dev" }} />
    );

    await waitFor(() => {
      expect(resourcesApi.fetchResourceGroups).toHaveBeenCalledWith("dev");
    });

    // Change environment
    rerender(
      <BlueprintForm {...defaultProps} formValues={{ environment: "staging" }} />
    );

    await waitFor(() => {
      expect(resourcesApi.fetchResourceGroups).toHaveBeenCalledWith("staging");
    });
  });

  it("shows loading indicator when fetching resource groups", async () => {
    // Make the API call take some time
    resourcesApi.fetchResourceGroups.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(["test-rg"]), 100))
    );

    render(<BlueprintForm {...defaultProps} formValues={{ environment: "dev" }} />);

    // Should show loading indicator
    expect(screen.getByText(/loading.../i)).toBeInTheDocument();
  });

  it("renders resource group dropdown with fetched options", async () => {
    render(<BlueprintForm {...defaultProps} formValues={{ environment: "dev" }} />);

    await waitFor(() => {
      expect(resourcesApi.fetchResourceGroups).toHaveBeenCalled();
    });

    expect(screen.getByText(/Resource Group Name/i)).toBeInTheDocument();

    // Check if the dropdown has the fetched options
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "test-rg-1" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "test-rg-2" })).toBeInTheDocument();
    });
  });

  it("disables project_name input when isUpdating is true", () => {
    const blueprintWithProjectName = {
      ...mockBlueprint,
      variables: [
        {
          name: "project_name",
          label: "Project Name",
          type: "string",
          required: true
        }
      ]
    };

    const propsWithUpdating = {
      ...defaultProps,
      blueprint: blueprintWithProjectName,
      isUpdating: true
    };

    render(<BlueprintForm {...propsWithUpdating} />);

    expect(screen.getByText(/Project Name/i)).toBeInTheDocument();
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it("returns null when blueprint is not provided", () => {
    const propsWithoutBlueprint = {
      ...defaultProps,
      blueprint: null
    };

    const { container } = render(<BlueprintForm {...propsWithoutBlueprint} />);
    expect(container.firstChild).toBeNull();
  });
});
