import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/dom';

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
vi.stubEnv('ADMIN_PASSWORD', 'test-admin-password');
