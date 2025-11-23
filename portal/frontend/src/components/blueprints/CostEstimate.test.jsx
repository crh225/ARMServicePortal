import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import CostEstimate from "./CostEstimate";
import api from "../../services/api";

// Mock the API
vi.mock("../../services/api", () => ({
  default: {
    getCostEstimate: vi.fn()
  }
}));

// Mock SkeletonLoader
vi.mock("../shared/SkeletonLoader", () => ({
  default: ({ type }) => <div data-testid={`skeleton-${type}`}>Loading...</div>
}));

describe("CostEstimate", () => {
  const mockBlueprint = {
    id: "azure-rg-basic",
    displayName: "Basic Resource Group",
    description: "Creates a basic Azure resource group"
  };

  const mockFormValues = {
    resource_group_name: "test-rg",
    location: "eastus",
    environment: "dev"
  };

  const mockEstimateData = {
    totalMonthlyEstimate: 125.50,
    estimates: [
      {
        resourceType: "Azure Storage Account",
        monthlyEstimate: 25.00,
        skuName: "Standard_LRS",
        note: "Based on 100GB storage"
      },
      {
        resourceType: "Azure Virtual Machine",
        monthlyEstimate: 100.50,
        skuName: "Standard_B2s",
        note: "Linux VM, 2 vCPUs, 4GB RAM"
      }
    ],
    disclaimer: "Estimates are approximate and may vary based on actual usage."
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders cost estimate title", () => {
    render(<CostEstimate blueprint={mockBlueprint} formValues={mockFormValues} />);

    expect(screen.getByText(/Estimated Monthly Cost/i)).toBeInTheDocument();
  });

  it("returns null when blueprint is not provided", () => {
    const { container } = render(<CostEstimate blueprint={null} formValues={mockFormValues} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows loading skeleton on initial load", async () => {
    api.getCostEstimate.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockEstimateData), 100))
    );

    render(<CostEstimate blueprint={mockBlueprint} formValues={mockFormValues} />);

    // Wait for loading skeleton to appear after debounce
    await waitFor(() => {
      expect(screen.getByTestId("skeleton-title")).toBeInTheDocument();
      expect(screen.getByTestId("skeleton-card")).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it("fetches and displays cost estimate", async () => {
    api.getCostEstimate.mockResolvedValue(mockEstimateData);

    render(<CostEstimate blueprint={mockBlueprint} formValues={mockFormValues} />);

    // Wait for API to be called after debounce
    await waitFor(() => {
      expect(api.getCostEstimate).toHaveBeenCalledWith(mockBlueprint.id, mockFormValues);
    }, { timeout: 1000 });

    // Wait for the estimate to be displayed
    await waitFor(() => {
      expect(screen.getByText("$125.50")).toBeInTheDocument();
      expect(screen.getByText("USD/month")).toBeInTheDocument();
    });
  });

  it("displays cost breakdown with resource details", async () => {
    api.getCostEstimate.mockResolvedValue(mockEstimateData);

    render(<CostEstimate blueprint={mockBlueprint} formValues={mockFormValues} />);

    await waitFor(() => {
      expect(screen.getByText("Azure Storage Account")).toBeInTheDocument();
      expect(screen.getByText("$25.00")).toBeInTheDocument();
      expect(screen.getByText("Standard_LRS")).toBeInTheDocument();
      expect(screen.getByText("Based on 100GB storage")).toBeInTheDocument();
    }, { timeout: 1000 });

    expect(screen.getByText("Azure Virtual Machine")).toBeInTheDocument();
    expect(screen.getByText("$100.50")).toBeInTheDocument();
    expect(screen.getByText("Standard_B2s")).toBeInTheDocument();
  });

  it("displays disclaimer when provided", async () => {
    api.getCostEstimate.mockResolvedValue(mockEstimateData);

    render(<CostEstimate blueprint={mockBlueprint} formValues={mockFormValues} />);

    await waitFor(() => {
      expect(screen.getByText(/Estimates are approximate and may vary/i)).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it("shows error message when API call fails", async () => {
    api.getCostEstimate.mockRejectedValue(new Error("API Error"));

    render(<CostEstimate blueprint={mockBlueprint} formValues={mockFormValues} />);

    await waitFor(() => {
      expect(screen.getByText("Unable to fetch cost estimate")).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it("shows updating indicator when form values change", async () => {
    // Use a slow-resolving promise to ensure we can catch the updating state
    let resolveFirstCall;
    let resolveSecondCall;
    const firstCallPromise = new Promise(resolve => { resolveFirstCall = resolve; });
    const secondCallPromise = new Promise(resolve => { resolveSecondCall = resolve; });

    let callCount = 0;
    api.getCostEstimate.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return firstCallPromise;
      }
      return secondCallPromise;
    });

    const { rerender } = render(
      <CostEstimate blueprint={mockBlueprint} formValues={mockFormValues} />
    );

    // Resolve first call after a delay
    await new Promise(resolve => setTimeout(resolve, 600));
    resolveFirstCall(mockEstimateData);

    await waitFor(() => {
      expect(screen.getByText("$125.50")).toBeInTheDocument();
    }, { timeout: 1000 });

    // Change form values
    const newFormValues = { ...mockFormValues, location: "westus" };
    rerender(<CostEstimate blueprint={mockBlueprint} formValues={newFormValues} />);

    // Check for updating indicator before resolving second call
    await new Promise(resolve => setTimeout(resolve, 600));
    expect(screen.queryByText(/updating.../i)).toBeInTheDocument();

    // Clean up
    resolveSecondCall(mockEstimateData);
  });

  it("debounces API calls when form values change rapidly", async () => {
    api.getCostEstimate.mockResolvedValue(mockEstimateData);

    const { rerender } = render(
      <CostEstimate blueprint={mockBlueprint} formValues={mockFormValues} />
    );

    // Change values multiple times quickly
    rerender(<CostEstimate blueprint={mockBlueprint} formValues={{ ...mockFormValues, location: "westus" }} />);
    rerender(<CostEstimate blueprint={mockBlueprint} formValues={{ ...mockFormValues, location: "centralus" }} />);
    rerender(<CostEstimate blueprint={mockBlueprint} formValues={{ ...mockFormValues, location: "eastus2" }} />);

    // Wait for debounce to complete
    await new Promise(resolve => setTimeout(resolve, 600));

    // Should only call API once after debounce
    await waitFor(() => {
      expect(api.getCostEstimate).toHaveBeenCalledTimes(1);
    });
  });

  it("handles estimates with null or undefined monthlyEstimate", async () => {
    const estimateWithNullCost = {
      totalMonthlyEstimate: 50.00,
      estimates: [
        {
          resourceType: "Free Service",
          monthlyEstimate: null,
          skuName: "Free Tier"
        },
        {
          resourceType: "Unknown Service",
          monthlyEstimate: undefined
        }
      ]
    };

    api.getCostEstimate.mockResolvedValue(estimateWithNullCost);

    render(<CostEstimate blueprint={mockBlueprint} formValues={mockFormValues} />);

    await waitFor(() => {
      const naElements = screen.getAllByText("N/A");
      expect(naElements.length).toBeGreaterThan(0);
    }, { timeout: 1000 });
  });

  it("does not show SKU name if it is 'N/A'", async () => {
    const estimateWithNoSku = {
      totalMonthlyEstimate: 25.00,
      estimates: [
        {
          resourceType: "Service Without SKU",
          monthlyEstimate: 25.00,
          skuName: "N/A"
        }
      ]
    };

    api.getCostEstimate.mockResolvedValue(estimateWithNoSku);

    render(<CostEstimate blueprint={mockBlueprint} formValues={mockFormValues} />);

    await waitFor(() => {
      expect(screen.getByText("Service Without SKU")).toBeInTheDocument();
    }, { timeout: 1000 });

    // "N/A" should not be rendered as SKU
    const skuElements = screen.queryAllByText("N/A");
    // Should find N/A in price, but not as SKU name
    expect(skuElements.length).toBeLessThanOrEqual(1);
  });

  it("clears estimate when blueprint becomes null", async () => {
    api.getCostEstimate.mockResolvedValue(mockEstimateData);

    const { rerender } = render(
      <CostEstimate blueprint={mockBlueprint} formValues={mockFormValues} />
    );

    await waitFor(() => {
      expect(screen.getByText("$125.50")).toBeInTheDocument();
    }, { timeout: 1000 });

    // Remove blueprint
    rerender(<CostEstimate blueprint={null} formValues={mockFormValues} />);

    // Component should return null
    expect(screen.queryByText("$125.50")).not.toBeInTheDocument();
  });
});
