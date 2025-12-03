import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BlueprintsPanel from "./BlueprintsPanel";
import * as useBlueprintsHook from "../../hooks/useBlueprints";

// Mock the hook
vi.mock("../../hooks/useBlueprints");

// Mock child components
vi.mock("./BlueprintsList", () => ({
  default: ({ blueprints, onSelectBlueprint }) => (
    <div data-testid="blueprints-list">
      {blueprints.map(bp => (
        <button key={bp.id} onClick={() => onSelectBlueprint(bp.id)}>
          {bp.displayName}
        </button>
      ))}
    </div>
  )
}));

vi.mock("./BlueprintsListSkeleton", () => ({
  default: () => <div data-testid="blueprints-list-skeleton">Loading...</div>
}));

vi.mock("./BlueprintForm", () => ({
  default: ({ blueprint, onSubmit, onClearSelection }) => (
    <div data-testid="blueprint-form">
      <h3>{blueprint?.displayName}</h3>
      <button onClick={onSubmit}>Submit Form</button>
      <button onClick={() => onClearSelection(null)}>Clear</button>
    </div>
  )
}));

vi.mock("./CostEstimate", () => ({
  default: ({ blueprint }) => (
    <div data-testid="cost-estimate">Cost for {blueprint?.displayName}</div>
  )
}));

vi.mock("../jobs/ResultPanel", () => ({
  default: ({ result, error }) => (
    <div data-testid="result-panel">
      {result && <div>Result: {result.pullRequestUrl}</div>}
      {error && <div>Error: {error}</div>}
    </div>
  )
}));

vi.mock("../shared/AuthModal", () => ({
  default: ({ isOpen, onClose }) => (
    isOpen ? (
      <div data-testid="auth-modal">
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null
  )
}));

describe("BlueprintsPanel", () => {
  const mockBlueprints = [
    {
      id: "azure-storage",
      displayName: "Azure Storage Account",
      description: "Create storage"
    }
  ];

  const defaultHookReturn = {
    blueprints: mockBlueprints,
    blueprintsLoading: false,
    selectedBlueprint: null,
    formValues: {},
    result: null,
    error: null,
    loading: false,
    policyErrors: null,
    showAuthModal: false,
    handleSelectBlueprint: vi.fn(),
    handleFormChange: vi.fn(),
    handleSubmit: vi.fn(),
    handleCloseAuthModal: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useBlueprintsHook.useBlueprints = vi.fn(() => defaultHookReturn);
  });

  it("shows blueprints list when loading is complete and no blueprint is selected", () => {
    render(<BlueprintsPanel updateResourceData={null} onClearUpdate={vi.fn()} />);

    expect(screen.getByTestId("blueprints-list")).toBeInTheDocument();
    expect(screen.getByText("Azure Storage Account")).toBeInTheDocument();
  });

  it("shows skeleton loader when blueprints are loading", () => {
    useBlueprintsHook.useBlueprints = vi.fn(() => ({
      ...defaultHookReturn,
      blueprintsLoading: true
    }));

    render(<BlueprintsPanel updateResourceData={null} onClearUpdate={vi.fn()} />);

    expect(screen.getByTestId("blueprints-list-skeleton")).toBeInTheDocument();
  });

  it("shows blueprint form when a blueprint is selected", () => {
    useBlueprintsHook.useBlueprints = vi.fn(() => ({
      ...defaultHookReturn,
      selectedBlueprint: mockBlueprints[0]
    }));

    render(<BlueprintsPanel updateResourceData={null} onClearUpdate={vi.fn()} />);

    expect(screen.getByTestId("blueprint-form")).toBeInTheDocument();
    expect(screen.getByText("Azure Storage Account")).toBeInTheDocument();
  });

  it("shows cost estimate when blueprint is selected", () => {
    useBlueprintsHook.useBlueprints = vi.fn(() => ({
      ...defaultHookReturn,
      selectedBlueprint: mockBlueprints[0]
    }));

    render(<BlueprintsPanel updateResourceData={null} onClearUpdate={vi.fn()} />);

    expect(screen.getByTestId("cost-estimate")).toBeInTheDocument();
    expect(screen.getByText("Cost for Azure Storage Account")).toBeInTheDocument();
  });

  it("shows Create GitHub PR button when blueprint is selected and no result", () => {
    useBlueprintsHook.useBlueprints = vi.fn(() => ({
      ...defaultHookReturn,
      selectedBlueprint: mockBlueprints[0]
    }));

    render(<BlueprintsPanel updateResourceData={null} onClearUpdate={vi.fn()} />);

    expect(screen.getByText("Create GitHub PR")).toBeInTheDocument();
  });

  it("shows loading state on Create GitHub PR button when loading", () => {
    useBlueprintsHook.useBlueprints = vi.fn(() => ({
      ...defaultHookReturn,
      selectedBlueprint: mockBlueprints[0],
      loading: true
    }));

    render(<BlueprintsPanel updateResourceData={null} onClearUpdate={vi.fn()} />);

    expect(screen.getByText("Creating GitHub PR...")).toBeInTheDocument();
  });

  it("disables Create GitHub PR button when loading", () => {
    useBlueprintsHook.useBlueprints = vi.fn(() => ({
      ...defaultHookReturn,
      selectedBlueprint: mockBlueprints[0],
      loading: true
    }));

    render(<BlueprintsPanel updateResourceData={null} onClearUpdate={vi.fn()} />);

    const button = screen.getByText("Creating GitHub PR...");
    expect(button).toBeDisabled();
  });

  it("calls handleSubmit when Create GitHub PR button is clicked", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    useBlueprintsHook.useBlueprints = vi.fn(() => ({
      ...defaultHookReturn,
      selectedBlueprint: mockBlueprints[0],
      handleSubmit
    }));

    render(<BlueprintsPanel updateResourceData={null} onClearUpdate={vi.fn()} />);

    const button = screen.getByText("Create GitHub PR");
    await user.click(button);

    expect(handleSubmit).toHaveBeenCalled();
  });

  it("shows hint text about Terraform when blueprint is selected", () => {
    useBlueprintsHook.useBlueprints = vi.fn(() => ({
      ...defaultHookReturn,
      selectedBlueprint: mockBlueprints[0]
    }));

    render(<BlueprintsPanel updateResourceData={null} onClearUpdate={vi.fn()} />);

    expect(screen.getByText(/The portal never applies infrastructure changes directly/)).toBeInTheDocument();
  });

  it("shows result panel when result is available", () => {
    useBlueprintsHook.useBlueprints = vi.fn(() => ({
      ...defaultHookReturn,
      selectedBlueprint: mockBlueprints[0],
      result: { pullRequestUrl: "https://github.com/test/repo/pull/123" }
    }));

    render(<BlueprintsPanel updateResourceData={null} onClearUpdate={vi.fn()} />);

    expect(screen.getByTestId("result-panel")).toBeInTheDocument();
    expect(screen.getByText("Result: https://github.com/test/repo/pull/123")).toBeInTheDocument();
  });

  it("shows result panel when error is available", () => {
    useBlueprintsHook.useBlueprints = vi.fn(() => ({
      ...defaultHookReturn,
      selectedBlueprint: mockBlueprints[0],
      error: "Something went wrong"
    }));

    render(<BlueprintsPanel updateResourceData={null} onClearUpdate={vi.fn()} />);

    expect(screen.getByTestId("result-panel")).toBeInTheDocument();
    expect(screen.getByText("Error: Something went wrong")).toBeInTheDocument();
  });

  it("hides Create GitHub PR button when result is available", () => {
    useBlueprintsHook.useBlueprints = vi.fn(() => ({
      ...defaultHookReturn,
      selectedBlueprint: mockBlueprints[0],
      result: { pullRequestUrl: "https://github.com/test/repo/pull/123" }
    }));

    render(<BlueprintsPanel updateResourceData={null} onClearUpdate={vi.fn()} />);

    expect(screen.queryByText("Create GitHub PR")).not.toBeInTheDocument();
  });

  it("shows auth modal when showAuthModal is true", () => {
    useBlueprintsHook.useBlueprints = vi.fn(() => ({
      ...defaultHookReturn,
      showAuthModal: true
    }));

    render(<BlueprintsPanel updateResourceData={null} onClearUpdate={vi.fn()} />);

    expect(screen.getByTestId("auth-modal")).toBeInTheDocument();
  });

  it("does not show auth modal when showAuthModal is false", () => {
    render(<BlueprintsPanel updateResourceData={null} onClearUpdate={vi.fn()} />);

    expect(screen.queryByTestId("auth-modal")).not.toBeInTheDocument();
  });

  describe("Update Resource Mode", () => {
    const mockUpdateResourceData = {
      number: 42,
      title: "Update Storage Account",
      environment: "dev",
      moduleName: "azure-storage-account",
      pullRequestUrl: "https://github.com/test/repo/pull/42",
      outputs: {
        storage_account_name: { value: "mystorageaccount123" },
        primary_endpoint: { value: "https://mystorageaccount123.blob.core.windows.net" }
      }
    };

    it("shows updating resource panel when updateResourceData is provided", () => {
      render(<BlueprintsPanel updateResourceData={mockUpdateResourceData} onClearUpdate={vi.fn()} />);

      expect(screen.getByText("Updating Resource")).toBeInTheDocument();
      expect(screen.getByText("Modifying an existing deployed resource.")).toBeInTheDocument();
    });

    it("displays PR number in update mode", () => {
      render(<BlueprintsPanel updateResourceData={mockUpdateResourceData} onClearUpdate={vi.fn()} />);

      expect(screen.getByText("#42")).toBeInTheDocument();
    });

    it("displays PR title in update mode", () => {
      render(<BlueprintsPanel updateResourceData={mockUpdateResourceData} onClearUpdate={vi.fn()} />);

      expect(screen.getByText("Update Storage Account")).toBeInTheDocument();
    });

    it("displays environment in update mode", () => {
      render(<BlueprintsPanel updateResourceData={mockUpdateResourceData} onClearUpdate={vi.fn()} />);

      expect(screen.getByText("Environment")).toBeInTheDocument();
      expect(screen.getByText("dev")).toBeInTheDocument();
    });

    it("displays module name in update mode", () => {
      render(<BlueprintsPanel updateResourceData={mockUpdateResourceData} onClearUpdate={vi.fn()} />);

      expect(screen.getByText("Module Name")).toBeInTheDocument();
      expect(screen.getByText("azure-storage-account")).toBeInTheDocument();
    });

    it("displays original PR link in update mode", () => {
      render(<BlueprintsPanel updateResourceData={mockUpdateResourceData} onClearUpdate={vi.fn()} />);

      expect(screen.getByText("Original PR")).toBeInTheDocument();
      const link = screen.getByText("View on GitHub");
      expect(link).toHaveAttribute("href", "https://github.com/test/repo/pull/42");
      expect(link).toHaveAttribute("target", "_blank");
    });

    it("displays current outputs in update mode", () => {
      render(<BlueprintsPanel updateResourceData={mockUpdateResourceData} onClearUpdate={vi.fn()} />);

      expect(screen.getByText("Current Outputs")).toBeInTheDocument();

      // Check that the outputs are displayed in the document
      const outputsText = screen.getByText("Current Outputs").parentElement;
      expect(outputsText.textContent).toContain("storage_account_name");
      expect(outputsText.textContent).toContain("mystorageaccount123");
      expect(outputsText.textContent).toContain("primary_endpoint");
    });

    it("does not display environment section when environment is missing", () => {
      const dataWithoutEnv = { ...mockUpdateResourceData, environment: null };

      render(<BlueprintsPanel updateResourceData={dataWithoutEnv} onClearUpdate={vi.fn()} />);

      expect(screen.queryByText("Environment")).not.toBeInTheDocument();
    });

    it("does not display module name section when moduleName is missing", () => {
      const dataWithoutModule = { ...mockUpdateResourceData, moduleName: null };

      render(<BlueprintsPanel updateResourceData={dataWithoutModule} onClearUpdate={vi.fn()} />);

      expect(screen.queryByText("Module Name")).not.toBeInTheDocument();
    });

    it("does not display PR link section when pullRequestUrl is missing", () => {
      const dataWithoutPR = { ...mockUpdateResourceData, pullRequestUrl: null };

      render(<BlueprintsPanel updateResourceData={dataWithoutPR} onClearUpdate={vi.fn()} />);

      expect(screen.queryByText("Original PR")).not.toBeInTheDocument();
    });

    it("does not display outputs section when outputs is empty", () => {
      const dataWithoutOutputs = { ...mockUpdateResourceData, outputs: {} };

      render(<BlueprintsPanel updateResourceData={dataWithoutOutputs} onClearUpdate={vi.fn()} />);

      expect(screen.queryByText("Current Outputs")).not.toBeInTheDocument();
    });

    it("handles outputs with plain string values", () => {
      const dataWithStringOutputs = {
        ...mockUpdateResourceData,
        outputs: {
          simple_value: "just-a-string"
        }
      };

      render(<BlueprintsPanel updateResourceData={dataWithStringOutputs} onClearUpdate={vi.fn()} />);

      expect(screen.getByText(/simple_value/)).toBeInTheDocument();
      expect(screen.getByText(/just-a-string/)).toBeInTheDocument();
    });

    it("switches to result panel when result becomes available in update mode", () => {
      useBlueprintsHook.useBlueprints = vi.fn(() => ({
        ...defaultHookReturn,
        result: { pullRequestUrl: "https://github.com/test/repo/pull/123" }
      }));

      render(<BlueprintsPanel updateResourceData={mockUpdateResourceData} onClearUpdate={vi.fn()} />);

      expect(screen.getByTestId("result-panel")).toBeInTheDocument();
      expect(screen.queryByText("Updating Resource")).not.toBeInTheDocument();
    });
  });
});
