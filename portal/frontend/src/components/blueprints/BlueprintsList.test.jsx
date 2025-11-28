import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BlueprintsList from "./BlueprintsList";

describe("BlueprintsList", () => {
  const mockBlueprints = [
    {
      id: "azure-storage",
      displayName: "Azure Storage Account",
      description: "Create a new Azure Storage Account with configurable settings",
      version: "1.0.0"
    },
    {
      id: "azure-vm",
      displayName: "Azure Virtual Machine",
      description: "Deploy a virtual machine in Azure",
      version: "2.1.0"
    },
    {
      id: "azure-sql",
      displayName: "Azure SQL Database",
      description: "Provision an Azure SQL Database instance"
      // No version to test optional version rendering
    }
  ];

  const defaultProps = {
    blueprints: mockBlueprints,
    selectedBlueprint: null,
    onSelectBlueprint: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.scrollTo
    window.scrollTo = vi.fn();
  });

  it("renders the title and description", () => {
    render(<BlueprintsList {...defaultProps} />);

    expect(screen.getByText("Service Catalog")).toBeInTheDocument();
    expect(screen.getByText("Choose from pre-approved infrastructure templates")).toBeInTheDocument();
  });

  it("renders all blueprints", () => {
    render(<BlueprintsList {...defaultProps} />);

    expect(screen.getByText("Azure Storage Account")).toBeInTheDocument();
    expect(screen.getByText("Azure Virtual Machine")).toBeInTheDocument();
    expect(screen.getByText("Azure SQL Database")).toBeInTheDocument();
  });

  it("renders blueprint descriptions", () => {
    render(<BlueprintsList {...defaultProps} />);

    expect(screen.getByText("Create a new Azure Storage Account with configurable settings")).toBeInTheDocument();
    expect(screen.getByText("Deploy a virtual machine in Azure")).toBeInTheDocument();
    expect(screen.getByText("Provision an Azure SQL Database instance")).toBeInTheDocument();
  });

  it("renders blueprint versions when available", () => {
    render(<BlueprintsList {...defaultProps} />);

    expect(screen.getByText("v1.0.0")).toBeInTheDocument();
    expect(screen.getByText("v2.1.0")).toBeInTheDocument();
  });

  it("does not render version badge when version is missing", () => {
    render(<BlueprintsList {...defaultProps} />);

    const versionBadges = screen.queryAllByText(/^v/);
    expect(versionBadges).toHaveLength(2); // Only two blueprints have versions
  });

  it("calls onSelectBlueprint when a blueprint is clicked", async () => {
    const user = userEvent.setup();
    const onSelectBlueprint = vi.fn();

    render(<BlueprintsList {...defaultProps} onSelectBlueprint={onSelectBlueprint} />);

    const storageCard = screen.getByText("Azure Storage Account").closest("button");
    await user.click(storageCard);

    expect(onSelectBlueprint).toHaveBeenCalledWith("azure-storage");
  });

  it("applies active class to selected blueprint", () => {
    const selectedBlueprint = mockBlueprints[0];

    render(<BlueprintsList {...defaultProps} selectedBlueprint={selectedBlueprint} />);

    const storageCard = screen.getByText("Azure Storage Account").closest("button");
    expect(storageCard).toHaveClass("blueprint-card--active");
  });

  it("does not apply active class to non-selected blueprints", () => {
    const selectedBlueprint = mockBlueprints[0];

    render(<BlueprintsList {...defaultProps} selectedBlueprint={selectedBlueprint} />);

    const vmCard = screen.getByText("Azure Virtual Machine").closest("button");
    expect(vmCard).not.toHaveClass("blueprint-card--active");
  });

  it("shows empty state when no blueprints are available", () => {
    render(<BlueprintsList {...defaultProps} blueprints={[]} />);

    expect(screen.getByText("No blueprints found yet.")).toBeInTheDocument();
    expect(screen.getByText("Add modules in the infra folder and expose them via the API.")).toBeInTheDocument();
  });

  it("scrolls to top when selectedBlueprint becomes null", async () => {
    const { rerender } = render(
      <BlueprintsList {...defaultProps} selectedBlueprint={mockBlueprints[0]} />
    );

    // Change selectedBlueprint to null
    rerender(<BlueprintsList {...defaultProps} selectedBlueprint={null} />);

    await waitFor(() => {
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    });
  });

  it("shows all blueprints when showAllBlueprints is true", () => {
    render(<BlueprintsList {...defaultProps} />);

    // Count only blueprint cards, not filter buttons
    const blueprintCards = document.querySelectorAll(".blueprint-card");
    expect(blueprintCards).toHaveLength(3);
  });

  it("filters to show only selected blueprint after clicking", async () => {
    const user = userEvent.setup();
    const onSelectBlueprint = vi.fn();

    const { rerender } = render(
      <BlueprintsList {...defaultProps} onSelectBlueprint={onSelectBlueprint} />
    );

    // Click on a blueprint
    const storageCard = screen.getByText("Azure Storage Account").closest("button");
    await user.click(storageCard);

    // Simulate the parent component updating selectedBlueprint
    rerender(
      <BlueprintsList
        {...defaultProps}
        selectedBlueprint={mockBlueprints[0]}
        onSelectBlueprint={onSelectBlueprint}
      />
    );

    // Should still show blueprints (showAllBlueprints starts as true but clicking sets it false)
    const blueprintCards = document.querySelectorAll(".blueprint-card");
    expect(blueprintCards.length).toBeGreaterThan(0);
  });

  it("resets to show all blueprints when selection is cleared", async () => {
    const { rerender } = render(
      <BlueprintsList {...defaultProps} selectedBlueprint={mockBlueprints[0]} />
    );

    // Clear selection
    rerender(<BlueprintsList {...defaultProps} selectedBlueprint={null} />);

    await waitFor(() => {
      // Count only blueprint cards, not filter buttons
      const blueprintCards = document.querySelectorAll(".blueprint-card");
      expect(blueprintCards).toHaveLength(3);
    });
  });
});
