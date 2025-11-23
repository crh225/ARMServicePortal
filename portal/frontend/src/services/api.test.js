import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import api from "./api";

// Mock fetch globally
global.fetch = vi.fn();

// Helper to check if URL ends with expected path
const expectFetchCalledWith = (path, options) => {
  const calls = global.fetch.mock.calls;
  expect(calls.length).toBeGreaterThan(0);
  const lastCall = calls[calls.length - 1];
  const url = lastCall[0];

  // Check if URL ends with the expected path
  if (typeof url === 'string') {
    expect(url.endsWith(path) || url === path).toBe(true);
  } else {
    expect(url.toString().endsWith(path)).toBe(true);
  }

  if (options) {
    expect(lastCall[1]).toEqual(options);
  }
};

describe("api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchBlueprints", () => {
    it("fetches blueprints successfully", async () => {
      const mockBlueprints = [
        { id: "azure-storage", displayName: "Azure Storage" },
        { id: "azure-vm", displayName: "Azure VM" }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlueprints
      });

      const result = await api.fetchBlueprints();

      expectFetchCalledWith("/api/catalog");
      expect(result).toEqual(mockBlueprints);
    });

    it("throws error when fetch fails", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false
      });

      await expect(api.fetchBlueprints()).rejects.toThrow("Failed to load blueprints");
    });
  });

  describe("provisionBlueprint", () => {
    const blueprintId = "azure-storage";
    const variables = { location: "eastus", name: "mystorage" };

    it("provisions blueprint successfully without token", async () => {
      const mockResponse = { pullRequestUrl: "https://github.com/test/repo/pull/1" };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await api.provisionBlueprint(blueprintId, variables);

      expectFetchCalledWith("/api/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blueprintId,
          variables
        })
      });
      expect(result).toEqual(mockResponse);
    });

    it("provisions blueprint with GitHub token", async () => {
      localStorage.setItem("github_token", "test-token-123");

      const mockResponse = { pullRequestUrl: "https://github.com/test/repo/pull/1" };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await api.provisionBlueprint(blueprintId, variables);

      expectFetchCalledWith("/api/provision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer test-token-123"
        },
        body: JSON.stringify({
          blueprintId,
          variables
        })
      });
    });

    it("provisions blueprint with moduleName for updates", async () => {
      const moduleName = "existing-module";
      const mockResponse = { pullRequestUrl: "https://github.com/test/repo/pull/2" };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await api.provisionBlueprint(blueprintId, variables, moduleName);

      expectFetchCalledWith("/api/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blueprintId,
          variables,
          moduleName
        })
      });
    });

    it("returns policy errors when validation fails", async () => {
      const errorData = {
        error: "Policy validation failed",
        policyErrors: [
          { field: "location", message: "Location not allowed" }
        ],
        policyWarnings: [
          { field: "name", message: "Name should follow convention" }
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => errorData
      });

      const result = await api.provisionBlueprint(blueprintId, variables);

      expect(result).toEqual(errorData);
      expect(result.policyErrors).toBeDefined();
      expect(result.policyWarnings).toBeDefined();
    });

    it("throws error when provision fails without policy errors", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Internal server error" })
      });

      await expect(api.provisionBlueprint(blueprintId, variables))
        .rejects.toThrow("Internal server error");
    });

    it("throws error with details field when available", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ details: "Detailed error message" })
      });

      await expect(api.provisionBlueprint(blueprintId, variables))
        .rejects.toThrow("Detailed error message");
    });

    it("throws generic error when JSON parsing fails", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => { throw new Error("Invalid JSON"); }
      });

      await expect(api.provisionBlueprint(blueprintId, variables))
        .rejects.toThrow("Failed to submit provision request");
    });
  });

  describe("fetchJobs", () => {
    it("fetches jobs successfully", async () => {
      const mockJobs = [
        { number: 1, status: "completed" },
        { number: 2, status: "pending" }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockJobs
      });

      const result = await api.fetchJobs();

      expectFetchCalledWith("/api/jobs");
      expect(result).toEqual(mockJobs);
    });

    it("throws error when fetch fails", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false
      });

      await expect(api.fetchJobs()).rejects.toThrow("Failed to load jobs");
    });
  });

  describe("fetchJobDetail", () => {
    it("fetches job detail successfully", async () => {
      const jobNumber = 123;
      const mockJobDetail = {
        number: 123,
        status: "completed",
        logs: ["log1", "log2"]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockJobDetail
      });

      const result = await api.fetchJobDetail(jobNumber);

      expectFetchCalledWith("/api/jobs/123");
      expect(result).toEqual(mockJobDetail);
    });

    it("throws error when fetch fails", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false
      });

      await expect(api.fetchJobDetail(123)).rejects.toThrow("Failed to load job details");
    });
  });

  describe("destroyResource", () => {
    it("destroys resource successfully", async () => {
      const resourceNumber = 42;
      const mockResponse = { pullRequestUrl: "https://github.com/test/repo/pull/10" };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await api.destroyResource(resourceNumber);

      expectFetchCalledWith("/api/destroy/42", {
        method: "POST"
      });
      expect(result).toEqual(mockResponse);
    });

    it("throws error with details when destroy fails", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ details: "Resource not found" })
      });

      await expect(api.destroyResource(42))
        .rejects.toThrow("Resource not found");
    });

    it("throws error with error field when details not available", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Destroy failed" })
      });

      await expect(api.destroyResource(42))
        .rejects.toThrow("Destroy failed");
    });

    it("throws generic error when JSON parsing fails", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => { throw new Error("Invalid JSON"); }
      });

      await expect(api.destroyResource(42))
        .rejects.toThrow("Failed to create destroy PR");
    });
  });

  describe("promoteResource", () => {
    it("promotes resource successfully", async () => {
      const resourceNumber = 42;
      const mockResponse = { pullRequestUrl: "https://github.com/test/repo/pull/11" };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await api.promoteResource(resourceNumber);

      expectFetchCalledWith("/api/promote/42", {
        method: "POST"
      });
      expect(result).toEqual(mockResponse);
    });

    it("throws error with details when promote fails", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ details: "Cannot promote to production" })
      });

      await expect(api.promoteResource(42))
        .rejects.toThrow("Cannot promote to production");
    });

    it("throws error with error field when details not available", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Promotion failed" })
      });

      await expect(api.promoteResource(42))
        .rejects.toThrow("Promotion failed");
    });

    it("throws generic error when JSON parsing fails", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => { throw new Error("Invalid JSON"); }
      });

      await expect(api.promoteResource(42))
        .rejects.toThrow("Failed to create promotion PR");
    });
  });

  describe("getCostEstimate", () => {
    const blueprintId = "azure-storage";
    const variables = { location: "eastus", sku: "Standard_LRS" };

    it("gets cost estimate successfully", async () => {
      const mockEstimate = {
        totalMonthlyEstimate: 25.50,
        estimates: [
          { resourceType: "Storage Account", monthlyEstimate: 25.50 }
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEstimate
      });

      const result = await api.getCostEstimate(blueprintId, variables);

      expectFetchCalledWith("/api/pricing/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blueprintId,
          variables
        })
      });
      expect(result).toEqual(mockEstimate);
    });

    it("throws error when cost estimate fails", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false
      });

      await expect(api.getCostEstimate(blueprintId, variables))
        .rejects.toThrow("Failed to fetch cost estimate");
    });
  });

  describe("fetchResources", () => {
    it("fetches resources with costs by default", async () => {
      const mockResources = [
        { id: 1, name: "resource1", cost: 100 },
        { id: 2, name: "resource2", cost: 200 }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ resources: mockResources, count: 2 })
      });

      const result = await api.fetchResources();

      const expectedUrl = new URL("/api/resources", window.location.origin);
      expectedUrl.searchParams.set("includeCosts", "true");

      expect(global.fetch).toHaveBeenCalled();
      const callUrl = global.fetch.mock.calls[0][0];
      expect(callUrl.toString()).toContain("includeCosts=true");
      expect(result).toEqual(mockResources);
    });

    it("fetches resources without costs when specified", async () => {
      const mockResources = [
        { id: 1, name: "resource1" },
        { id: 2, name: "resource2" }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ resources: mockResources })
      });

      const result = await api.fetchResources(false);

      const callUrl = global.fetch.mock.calls[0][0];
      expect(callUrl.toString()).toContain("includeCosts=false");
      expect(result).toEqual(mockResources);
    });

    it("handles array response format", async () => {
      const mockResources = [
        { id: 1, name: "resource1" },
        { id: 2, name: "resource2" }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResources
      });

      const result = await api.fetchResources();

      expect(result).toEqual(mockResources);
    });

    it("handles object response without resources property", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ count: 0, skip: 0, top: 10 })
      });

      const result = await api.fetchResources();

      expect(result).toEqual([]);
    });

    it("throws error when fetch fails", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false
      });

      await expect(api.fetchResources()).rejects.toThrow("Failed to load resources");
    });
  });

  describe("fetchSubscriptions", () => {
    it("fetches subscriptions successfully", async () => {
      const mockSubscriptions = [
        { id: "sub-1", name: "Subscription 1" },
        { id: "sub-2", name: "Subscription 2" }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subscriptions: mockSubscriptions, count: 2 })
      });

      const result = await api.fetchSubscriptions();

      expectFetchCalledWith("/api/subscriptions");
      expect(result).toEqual(mockSubscriptions);
    });

    it("returns empty array when subscriptions property is missing", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      const result = await api.fetchSubscriptions();

      expect(result).toEqual([]);
    });

    it("throws error when fetch fails", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false
      });

      await expect(api.fetchSubscriptions()).rejects.toThrow("Failed to load subscriptions");
    });
  });
});
