// Test setup file
// Mock database for unit tests
jest.mock('../config/database', () => ({
  db: {
    query: jest.fn(),
    queryOne: jest.fn(),
    transaction: jest.fn(),
    testConnection: jest.fn().mockResolvedValue(true),
    close: jest.fn(),
  },
}));

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));
