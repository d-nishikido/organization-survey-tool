import { ConnectionPool, createOptimizedPoolConfig } from '../database/connection-pool';
import { TransactionManager } from '../database/transaction-manager';
import { logger } from '../utils/logger';

class Database {
  private connectionPool: ConnectionPool;
  private transactionManager: TransactionManager;

  constructor() {
    const poolConfig = createOptimizedPoolConfig();
    this.connectionPool = new ConnectionPool(poolConfig);
    this.transactionManager = TransactionManager.getInstance();
    
    logger.info('Database initialized with optimized connection pool');
  }

  // Expose the pool property for backward compatibility
  get pool() {
    return this.connectionPool['pool'];
  }

  /**
   * Execute a query with optional parameters
   */
  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    return this.connectionPool.query<T>(text, params);
  }

  /**
   * Execute a query and return the first row
   */
  async queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
    return this.connectionPool.queryOne<T>(text, params);
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction<T>(
    callback: (query: (text: string, params?: any[]) => Promise<any[]>) => Promise<T>,
  ): Promise<T> {
    return this.transactionManager.withTransaction(async (transaction) => {
      const transactionQuery = async (text: string, params?: any[]) => {
        return transaction.query(text, params);
      };
      return callback(transactionQuery);
    });
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    return this.connectionPool.isHealthy();
  }

  /**
   * Close all connections in the pool
   */
  async close(): Promise<void> {
    await this.connectionPool.gracefulShutdown();
  }

  /**
   * Get connection pool metrics
   */
  getMetrics() {
    return this.connectionPool.getMetrics();
  }

  /**
   * Get transaction manager instance
   */
  getTransactionManager(): TransactionManager {
    return this.transactionManager;
  }
}

// Export singleton instance
export const db = new Database();
