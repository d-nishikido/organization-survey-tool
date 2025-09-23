import { ConnectionPool, createOptimizedPoolConfig } from '../../database/connection-pool';
import { Pool, PoolClient } from 'pg';

// Mock pg module
jest.mock('pg', () => ({
  Pool: jest.fn(),
}));

// Mock config
jest.mock('../../config/config', () => ({
  config: {
    databaseUrl: 'postgresql://test:test@localhost:5432/test',
  },
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('ConnectionPool', () => {
  let mockPool: jest.Mocked<Pool>;
  let mockClient: jest.Mocked<PoolClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    } as any;

    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient),
      end: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      get totalCount() { return 5; },
      set totalCount(value: number) { /* mock setter */ },
      get idleCount() { return 3; },
      set idleCount(value: number) { /* mock setter */ },
      get waitingCount() { return 1; },
      set waitingCount(value: number) { /* mock setter */ },
    } as any;

    (Pool as jest.MockedClass<typeof Pool>).mockImplementation(() => mockPool);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should create pool with default configuration', () => {
      const config = {
        connectionString: 'postgresql://test:test@localhost:5432/test',
      };

      new ConnectionPool(config);

      expect(Pool).toHaveBeenCalledWith({
        connectionString: 'postgresql://test:test@localhost:5432/test',
        min: 2,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        acquireTimeoutMillis: 60000,
        createTimeoutMillis: 3000,
        destroyTimeoutMillis: 5000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
        healthCheckIntervalMillis: 30000,
        healthCheckQuery: 'SELECT 1',
        enableMetrics: true,
        metricsIntervalMillis: 10000,
      });
    });

    it('should setup event handlers', () => {
      const config = {
        connectionString: 'postgresql://test:test@localhost:5432/test',
      };

      new ConnectionPool(config);

      expect(mockPool.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockPool.on).toHaveBeenCalledWith('acquire', expect.any(Function));
      expect(mockPool.on).toHaveBeenCalledWith('remove', expect.any(Function));
      expect(mockPool.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('query', () => {
    it('should execute query and return rows', async () => {
      const config = { connectionString: 'test' };
      const pool = new ConnectionPool(config);

      const mockRows = [{ id: 1, name: 'test' }];
      mockClient.query.mockResolvedValue({ rows: mockRows } as any);

      const result = await pool.query('SELECT * FROM test');

      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM test', undefined);
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toEqual(mockRows);
    });

    it('should handle query errors and release client', async () => {
      const config = { connectionString: 'test' };
      const pool = new ConnectionPool(config);

      const error = new Error('Query failed');
      mockClient.query.mockRejectedValue(error);

      await expect(pool.query('SELECT * FROM test')).rejects.toThrow('Query failed');

      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw error when shutting down', async () => {
      const config = { connectionString: 'test' };
      const pool = new ConnectionPool(config);

      // Simulate shutdown
      pool['isShuttingDown'] = true;

      await expect(pool.query('SELECT * FROM test'))
        .rejects.toThrow('Connection pool is shutting down');
    });
  });

  describe('healthCheck', () => {
    it('should return true when health check passes', async () => {
      const config = { connectionString: 'test' };
      const pool = new ConnectionPool(config);

      mockClient.query.mockResolvedValue({ rows: [{ result: 1 }] } as any);

      const result = await pool.healthCheck();

      expect(result).toBe(true);
      expect(mockClient.query).toHaveBeenCalledWith('SELECT 1');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return false when health check fails', async () => {
      const config = { connectionString: 'test' };
      const pool = new ConnectionPool(config);

      mockClient.query.mockRejectedValue(new Error('Connection failed'));

      const result = await pool.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('getMetrics', () => {
    it('should return current pool metrics', () => {
      const config = { connectionString: 'test', max: 10, min: 1 };
      const pool = new ConnectionPool(config);

      const metrics = pool.getMetrics();

      expect(metrics).toEqual({
        totalConnections: 5,
        idleConnections: 3,
        waitingCount: 1,
        maxConnections: 10,
        minConnections: 1,
      });
    });
  });

  describe('gracefulShutdown', () => {
    it('should shutdown gracefully when no active connections', async () => {
      const config = { connectionString: 'test' };
      const pool = new ConnectionPool(config);

      // Mock pool with all connections idle
      Object.defineProperty(mockPool, 'totalCount', { get: () => 5 });
      Object.defineProperty(mockPool, 'idleCount', { get: () => 5 });

      await pool.gracefulShutdown();

      expect(mockPool.end).toHaveBeenCalled();
    });

    it('should wait for active connections before shutdown', async () => {
      const config = { connectionString: 'test' };
      const pool = new ConnectionPool(config);

      // Mock pool with active connections initially
      let idleCount = 2;
      Object.defineProperty(mockPool, 'totalCount', { get: () => 5 });
      Object.defineProperty(mockPool, 'idleCount', { get: () => idleCount });

      // Simulate connections becoming idle after some time
      setTimeout(() => {
        idleCount = 5;
      }, 2000);

      const shutdownPromise = pool.gracefulShutdown();
      
      // Fast forward time
      jest.advanceTimersByTime(3000);
      
      await shutdownPromise;

      expect(mockPool.end).toHaveBeenCalled();
    });
  });
});

describe('createOptimizedPoolConfig', () => {
  beforeEach(() => {
    // Clear environment variables
    delete process.env.NODE_ENV;
    delete process.env.DB_MAX_CONNECTIONS;
    delete process.env.DB_MIN_CONNECTIONS;
  });

  it('should create development configuration by default', () => {
    const config = createOptimizedPoolConfig();

    expect(config).toMatchObject({
      min: 2,
      max: 20,
      idleTimeoutMillis: 10000,
      enableMetrics: true,
      ssl: false,
    });
  });

  it('should create production configuration', () => {
    process.env.NODE_ENV = 'production';

    const config = createOptimizedPoolConfig();

    expect(config).toMatchObject({
      min: 2,
      max: 20,
      idleTimeoutMillis: 30000,
      ssl: { rejectUnauthorized: false },
    });
  });

  it('should use environment variables for connection limits', () => {
    process.env.DB_MAX_CONNECTIONS = '50';
    process.env.DB_MIN_CONNECTIONS = '5';

    const config = createOptimizedPoolConfig();

    expect(config.max).toBe(50);
    expect(config.min).toBe(5);
  });
});