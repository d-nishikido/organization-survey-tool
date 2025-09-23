import { Pool, PoolConfig, PoolClient } from 'pg';
import { config } from '../config/config';
import { logger } from '../utils/logger';

export interface PoolMetrics {
  totalConnections: number;
  idleConnections: number;
  waitingCount: number;
  maxConnections: number;
  minConnections: number;
}

export interface OptimizedPoolConfig extends PoolConfig {
  // Enhanced configuration options
  acquireTimeoutMillis?: number;
  createTimeoutMillis?: number;
  destroyTimeoutMillis?: number;
  reapIntervalMillis?: number;
  createRetryIntervalMillis?: number;
  
  // Health check options
  healthCheckIntervalMillis?: number;
  healthCheckQuery?: string;
  
  // Monitoring options
  enableMetrics?: boolean;
  metricsIntervalMillis?: number;
}

export class ConnectionPool {
  private pool: Pool;
  private config: OptimizedPoolConfig;
  private metrics: PoolMetrics;
  private healthCheckInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;
  private isShuttingDown: boolean = false;

  constructor(config: OptimizedPoolConfig) {
    this.config = {
      // Default optimized settings
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
      ...config,
    };

    this.pool = new Pool(this.config);
    this.metrics = this.initializeMetrics();
    this.setupEventHandlers();
    this.startHealthCheck();
    this.startMetricsCollection();
  }

  private initializeMetrics(): PoolMetrics {
    return {
      totalConnections: 0,
      idleConnections: 0,
      waitingCount: 0,
      maxConnections: this.config.max || 20,
      minConnections: this.config.min || 2,
    };
  }

  private setupEventHandlers(): void {
    this.pool.on('connect', (_client: PoolClient) => {
      logger.debug('New client connected', {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount,
      });
    });

    this.pool.on('acquire', (_client: PoolClient) => {
      logger.debug('Client acquired from pool', {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount,
      });
    });

    this.pool.on('remove', (_client: PoolClient) => {
      logger.debug('Client removed from pool', {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount,
      });
    });

    this.pool.on('error', (err: Error, _client: PoolClient) => {
      logger.error('Unexpected error on idle client', err);
      // Don't exit the process, just log the error
    });

    // Handle process termination gracefully
    process.on('SIGINT', () => this.gracefulShutdown());
    process.on('SIGTERM', () => this.gracefulShutdown());
  }

  private startHealthCheck(): void {
    if (!this.config.healthCheckIntervalMillis) return;

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.healthCheck();
      } catch (error) {
        logger.warn('Health check failed', error);
      }
    }, this.config.healthCheckIntervalMillis);
  }

  private startMetricsCollection(): void {
    if (!this.config.enableMetrics || !this.config.metricsIntervalMillis) return;

    this.metricsInterval = setInterval(() => {
      this.updateMetrics();
      logger.debug('Pool metrics', this.metrics);
    }, this.config.metricsIntervalMillis);
  }

  private updateMetrics(): void {
    this.metrics = {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      maxConnections: this.config.max || 20,
      minConnections: this.config.min || 2,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      try {
        await client.query(this.config.healthCheckQuery || 'SELECT 1');
        return true;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Health check failed', error);
      return false;
    }
  }

  async connect(): Promise<PoolClient> {
    if (this.isShuttingDown) {
      throw new Error('Connection pool is shutting down');
    }
    return this.pool.connect();
  }

  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const start = Date.now();
    const client = await this.connect();

    try {
      const result = await client.query(text, params);
      const duration = Date.now() - start;

      logger.debug('Executed query', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration,
        rows: result.rowCount,
      });

      return result.rows;
    } catch (error) {
      logger.error('Database query error', { query: text, error });
      throw error;
    } finally {
      client.release();
    }
  }

  async queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
    const result = await this.query<T>(text, params);
    return result[0] || null;
  }

  getMetrics(): PoolMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  getPoolInfo(): {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  } {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }

  async isHealthy(): Promise<boolean> {
    try {
      return await this.healthCheck();
    } catch {
      return false;
    }
  }

  async gracefulShutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    logger.info('Starting graceful shutdown of connection pool');
    this.isShuttingDown = true;

    // Clear intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    // Wait for active connections to finish (with timeout)
    const shutdownTimeout = 30000; // 30 seconds
    const start = Date.now();

    while (this.pool.totalCount > this.pool.idleCount && Date.now() - start < shutdownTimeout) {
      logger.info('Waiting for active connections to finish', {
        active: this.pool.totalCount - this.pool.idleCount,
        total: this.pool.totalCount,
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    try {
      await this.pool.end();
      logger.info('Connection pool closed successfully');
    } catch (error) {
      logger.error('Error closing connection pool', error);
    }
  }
}

// Create optimized pool configuration based on environment
export function createOptimizedPoolConfig(): OptimizedPoolConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  const maxConnections = parseInt(process.env.DB_MAX_CONNECTIONS || '20');
  const minConnections = parseInt(process.env.DB_MIN_CONNECTIONS || '2');

  return {
    connectionString: config.databaseUrl,
    min: minConnections,
    max: maxConnections,
    idleTimeoutMillis: isProduction ? 30000 : 10000,
    connectionTimeoutMillis: 2000,
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 3000,
    destroyTimeoutMillis: 5000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
    healthCheckIntervalMillis: isProduction ? 30000 : 10000,
    healthCheckQuery: 'SELECT 1',
    enableMetrics: true,
    metricsIntervalMillis: isProduction ? 60000 : 10000,
    
    // SSL configuration for production
    ssl: isProduction ? {
      rejectUnauthorized: false, // Configure based on your SSL setup
    } : false,
  };
}