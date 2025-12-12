/**
 * Catalog Unregister Action
 *
 * Unregisters an entity from the Backstage catalog by deleting the location
 * that references it. This effectively removes the entity from the catalog.
 */
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import fetch from 'node-fetch';

export interface CatalogUnregisterConfig {
  baseUrl: string;
  token?: string;
}

export function createCatalogUnregisterAction(config: CatalogUnregisterConfig) {
  return createTemplateAction<{
    entityRef: string;
  }>({
    id: 'catalog:unregister',
    description: 'Unregisters an entity from the Backstage catalog',
    schema: {
      input: {
        type: 'object' as const,
        required: ['entityRef'],
        properties: {
          entityRef: {
            type: 'string' as const,
            title: 'Entity Reference',
            description: 'The entity reference to unregister (e.g., component:default/my-service)',
          },
        },
      },
      output: {
        type: 'object' as const,
        properties: {
          unregistered: {
            type: 'boolean' as const,
            title: 'Unregistered',
            description: 'Whether the entity was successfully unregistered',
          },
          message: {
            type: 'string' as const,
            title: 'Message',
            description: 'Status message',
          },
        },
      },
    },
    async handler(ctx) {
      const { entityRef } = ctx.input;
      const { baseUrl, token } = config;

      ctx.logger.info(`Unregistering entity: ${entityRef}`);

      // Build headers with optional authorization
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      try {
        // First, get the entity to find its location
        const entityUrl = `${baseUrl}/api/catalog/entities/by-name/${entityRef.replace(':', '/')}`;
        ctx.logger.info(`Fetching entity from: ${entityUrl}`);

        const entityResponse = await fetch(entityUrl, {
          method: 'GET',
          headers,
        });

        if (entityResponse.status === 404) {
          ctx.logger.info(`Entity ${entityRef} not found (may already be unregistered)`);
          ctx.output('unregistered', true);
          ctx.output('message', `Entity ${entityRef} not found (may already be unregistered)`);
          return;
        }

        if (!entityResponse.ok) {
          const errorText = await entityResponse.text();
          throw new Error(`Failed to fetch entity: ${entityResponse.status} - ${errorText}`);
        }

        const entity = await entityResponse.json() as {
          metadata?: {
            annotations?: {
              'backstage.io/managed-by-location'?: string;
              'backstage.io/managed-by-origin-location'?: string;
            };
            uid?: string;
          };
        };

        // Get the origin location from annotations
        const originLocation = entity.metadata?.annotations?.['backstage.io/managed-by-origin-location'];

        if (!originLocation) {
          // If no origin location, try to delete by entity UID directly
          const entityUid = entity.metadata?.uid;
          if (entityUid) {
            ctx.logger.info(`No origin location found, attempting to delete entity by UID: ${entityUid}`);

            const deleteByUidUrl = `${baseUrl}/api/catalog/entities/by-uid/${entityUid}`;
            const deleteResponse = await fetch(deleteByUidUrl, {
              method: 'DELETE',
              headers,
            });

            if (deleteResponse.ok || deleteResponse.status === 204) {
              ctx.logger.info(`Entity ${entityRef} deleted successfully by UID`);
              ctx.output('unregistered', true);
              ctx.output('message', `Entity ${entityRef} deleted successfully`);
              return;
            }
          }

          throw new Error(`Entity ${entityRef} has no origin location annotation and could not be deleted by UID`);
        }

        ctx.logger.info(`Found origin location: ${originLocation}`);

        // Find the location ID by querying locations
        const locationsUrl = `${baseUrl}/api/catalog/locations`;
        const locationsResponse = await fetch(locationsUrl, {
          method: 'GET',
          headers,
        });

        if (!locationsResponse.ok) {
          throw new Error(`Failed to fetch locations: ${locationsResponse.status}`);
        }

        const locations = await locationsResponse.json() as Array<{
          data: {
            id: string;
            target: string;
            type: string;
          };
        }>;

        // Find the matching location
        const matchingLocation = locations.find(
          (loc) => loc.data.target === originLocation ||
                   originLocation.includes(loc.data.target)
        );

        if (matchingLocation) {
          // Delete the location, which will unregister the entity
          const deleteLocationUrl = `${baseUrl}/api/catalog/locations/${matchingLocation.data.id}`;
          ctx.logger.info(`Deleting location: ${deleteLocationUrl}`);

          const deleteResponse = await fetch(deleteLocationUrl, {
            method: 'DELETE',
            headers,
          });

          if (deleteResponse.ok || deleteResponse.status === 204) {
            ctx.logger.info(`Location deleted, entity ${entityRef} unregistered`);
            ctx.output('unregistered', true);
            ctx.output('message', `Entity ${entityRef} unregistered successfully`);
            return;
          } else {
            const errorText = await deleteResponse.text();
            throw new Error(`Failed to delete location: ${deleteResponse.status} - ${errorText}`);
          }
        } else {
          // No matching location found, try orphan deletion
          ctx.logger.info(`No matching location found for ${originLocation}, attempting orphan deletion`);

          const entityUid = entity.metadata?.uid;
          if (entityUid) {
            const deleteByUidUrl = `${baseUrl}/api/catalog/entities/by-uid/${entityUid}`;
            const deleteResponse = await fetch(deleteByUidUrl, {
              method: 'DELETE',
              headers,
            });

            if (deleteResponse.ok || deleteResponse.status === 204) {
              ctx.logger.info(`Entity ${entityRef} deleted as orphan`);
              ctx.output('unregistered', true);
              ctx.output('message', `Entity ${entityRef} deleted successfully (orphan deletion)`);
              return;
            }
          }

          throw new Error(`Could not find location to delete for entity ${entityRef}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.logger.error(`Failed to unregister entity: ${message}`);
        ctx.output('unregistered', false);
        ctx.output('message', `Failed to unregister: ${message}`);
        throw error;
      }
    },
  });
}
