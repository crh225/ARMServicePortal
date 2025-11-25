import { vi } from 'vitest';

// Global test setup
// Mock environment variables
process.env.GITHUB_APP_ID = 'test-app-id';
process.env.GITHUB_INSTALLATION_ID = 'test-install-id';
process.env.GITHUB_APP_PRIVATE_KEY = 'test-private-key';
process.env.GITHUB_INFRA_OWNER = 'test-owner';
process.env.GITHUB_INFRA_REPO = 'test-repo';
process.env.AZURE_SUBSCRIPTION_ID = 'test-sub-id';
process.env.AZURE_TENANT_ID = 'test-tenant-id';
process.env.AZURE_CLIENT_ID = 'test-client-id';
process.env.AZURE_CLIENT_SECRET = 'test-client-secret';

// Global mocks can be added here
global.console = {
  ...console,
  // Suppress console.error in tests unless explicitly needed
  error: vi.fn(),
  // Keep log for debugging
  log: console.log,
  warn: console.warn,
  info: console.info,
};
