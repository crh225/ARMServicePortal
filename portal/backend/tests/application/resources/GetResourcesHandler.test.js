import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetResourcesHandler } from '../../../src/application/resources/handlers/GetResourcesHandler.js';
import { GetResourcesQuery } from '../../../src/application/resources/queries/GetResourcesQuery.js';

describe('GetResourcesHandler', () => {
  let handler;
  let mockAzureResourceService;
  let mockResourceEnrichmentService;

  beforeEach(() => {
    // Mock Azure Resource Service
    mockAzureResourceService = {
      queryArmPortalResources: vi.fn()
    };

    // Mock Resource Enrichment Service
    mockResourceEnrichmentService = {
      enrichResourcesWithPRs: vi.fn()
    };

    handler = new GetResourcesHandler(
      mockAzureResourceService,
      mockResourceEnrichmentService
    );
  });

  describe('handle', () => {
    it('returns resources successfully', async () => {
      const query = new GetResourcesQuery({});

      const mockRawResources = [
        { id: '/subscriptions/123/resourceGroups/rg1/providers/Microsoft.Storage/storageAccounts/storage1', name: 'storage1' }
      ];

      const mockEnrichedEntities = [
        {
          toDTO: () => ({
            id: '/subscriptions/123/resourceGroups/rg1/providers/Microsoft.Storage/storageAccounts/storage1',
            name: 'storage1',
            pullRequestNumber: 42,
            status: 'merged'
          })
        }
      ];

      mockAzureResourceService.queryArmPortalResources.mockResolvedValue(mockRawResources);
      mockResourceEnrichmentService.enrichResourcesWithPRs.mockResolvedValue(mockEnrichedEntities);

      const result = await handler.handle(query);

      expect(result.isSuccess).toBe(true);
      expect(result.value.resources).toHaveLength(1);
      expect(result.value.resources[0].name).toBe('storage1');
      expect(result.value.resources[0].pullRequestNumber).toBe(42);
    });

    it('filters by environment', async () => {
      const query = new GetResourcesQuery({ environment: 'dev' });

      mockAzureResourceService.queryArmPortalResources.mockResolvedValue([]);
      mockResourceEnrichmentService.enrichResourcesWithPRs.mockResolvedValue([]);

      await handler.handle(query);

      expect(mockAzureResourceService.queryArmPortalResources).toHaveBeenCalledWith({
        environment: 'dev'
      });
    });

    it('filters by blueprintId', async () => {
      const query = new GetResourcesQuery({ blueprintId: 'azure-storage' });

      mockAzureResourceService.queryArmPortalResources.mockResolvedValue([]);
      mockResourceEnrichmentService.enrichResourcesWithPRs.mockResolvedValue([]);

      await handler.handle(query);

      expect(mockAzureResourceService.queryArmPortalResources).toHaveBeenCalledWith({
        blueprintId: 'azure-storage'
      });
    });

    it('filters by resourceGroup', async () => {
      const query = new GetResourcesQuery({ resourceGroup: 'my-rg' });

      mockAzureResourceService.queryArmPortalResources.mockResolvedValue([]);
      mockResourceEnrichmentService.enrichResourcesWithPRs.mockResolvedValue([]);

      await handler.handle(query);

      expect(mockAzureResourceService.queryArmPortalResources).toHaveBeenCalledWith({
        resourceGroup: 'my-rg'
      });
    });

    it('splits comma-separated subscriptions', async () => {
      const query = new GetResourcesQuery({ subscriptions: 'sub1, sub2, sub3' });

      mockAzureResourceService.queryArmPortalResources.mockResolvedValue([]);
      mockResourceEnrichmentService.enrichResourcesWithPRs.mockResolvedValue([]);

      await handler.handle(query);

      expect(mockAzureResourceService.queryArmPortalResources).toHaveBeenCalledWith({
        subscriptions: ['sub1', 'sub2', 'sub3']
      });
    });

    it('includes costs when requested', async () => {
      const query = new GetResourcesQuery({ includeCosts: 'true' });

      mockAzureResourceService.queryArmPortalResources.mockResolvedValue([]);
      mockResourceEnrichmentService.enrichResourcesWithPRs.mockResolvedValue([]);

      await handler.handle(query);

      expect(mockResourceEnrichmentService.enrichResourcesWithPRs).toHaveBeenCalledWith(
        [],
        true
      );
    });

    it('excludes costs when not requested', async () => {
      const query = new GetResourcesQuery({ includeCosts: 'false' });

      mockAzureResourceService.queryArmPortalResources.mockResolvedValue([]);
      mockResourceEnrichmentService.enrichResourcesWithPRs.mockResolvedValue([]);

      await handler.handle(query);

      expect(mockResourceEnrichmentService.enrichResourcesWithPRs).toHaveBeenCalledWith(
        [],
        false
      );
    });

    it('handles pagination with skip and top', async () => {
      const query = new GetResourcesQuery({ skip: '10', top: '50' });

      mockAzureResourceService.queryArmPortalResources.mockResolvedValue([]);
      mockResourceEnrichmentService.enrichResourcesWithPRs.mockResolvedValue([]);

      await handler.handle(query);

      expect(mockAzureResourceService.queryArmPortalResources).toHaveBeenCalledWith({
        skip: 10,
        top: 50
      });
    });

    it('ignores invalid skip values', async () => {
      const query = new GetResourcesQuery({ skip: 'invalid' });

      mockAzureResourceService.queryArmPortalResources.mockResolvedValue([]);
      mockResourceEnrichmentService.enrichResourcesWithPRs.mockResolvedValue([]);

      await handler.handle(query);

      const callArgs = mockAzureResourceService.queryArmPortalResources.mock.calls[0][0];
      expect(callArgs.skip).toBeUndefined();
    });

    it('ignores negative skip values', async () => {
      const query = new GetResourcesQuery({ skip: '-5' });

      mockAzureResourceService.queryArmPortalResources.mockResolvedValue([]);
      mockResourceEnrichmentService.enrichResourcesWithPRs.mockResolvedValue([]);

      await handler.handle(query);

      const callArgs = mockAzureResourceService.queryArmPortalResources.mock.calls[0][0];
      expect(callArgs.skip).toBeUndefined();
    });

    it('limits top to maximum of 1000', async () => {
      const query = new GetResourcesQuery({ top: '2000' });

      mockAzureResourceService.queryArmPortalResources.mockResolvedValue([]);
      mockResourceEnrichmentService.enrichResourcesWithPRs.mockResolvedValue([]);

      await handler.handle(query);

      const callArgs = mockAzureResourceService.queryArmPortalResources.mock.calls[0][0];
      expect(callArgs.top).toBeUndefined();
    });

    it('returns count and pagination metadata', async () => {
      const query = new GetResourcesQuery({ skip: '10', top: '50' });

      const mockEnrichedEntities = [
        { toDTO: () => ({ id: '1' }) },
        { toDTO: () => ({ id: '2' }) }
      ];

      mockAzureResourceService.queryArmPortalResources.mockResolvedValue([{}, {}]);
      mockResourceEnrichmentService.enrichResourcesWithPRs.mockResolvedValue(mockEnrichedEntities);

      const result = await handler.handle(query);

      expect(result.value.count).toBe(2);
      expect(result.value.skip).toBe(10);
      expect(result.value.top).toBe(50);
    });

    it('returns failure result on error', async () => {
      const query = new GetResourcesQuery({});

      mockAzureResourceService.queryArmPortalResources.mockRejectedValue(
        new Error('Azure API error')
      );

      const result = await handler.handle(query);

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toBe('Azure API error');
    });
  });
});
