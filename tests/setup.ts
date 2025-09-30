// Test setup file
import { initDatabase, closeDatabase } from "../src/database/init";

// Global test setup
beforeAll(async () => {
  // Initialize test database
  initDatabase();
});

// Global test cleanup
afterAll(async () => {
  // Close database connection
  closeDatabase();
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
