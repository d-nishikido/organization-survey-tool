import { Pool, PoolConfig } from 'pg';
import { config } from './config';
import { logger } from '../utils/logger';

class Database {
  private pool: Pool;

  constructor() {
    const poolConfig: PoolConfig = {
      connectionString: config.databaseUrl,
      max: 20, // Maximum number of connections in the pool
      idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
      connectionTimeoutMillis: 2000, // How long to wait when connecting a new client
    };

    this.pool = new Pool(poolConfig);

    // Handle pool errors
    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
      process.exit(-1);
    });

    // Log successful connection
    this.pool.on('connect', () => {
      logger.debug('Database connection established');
    });
  }

  /**
   * Execute a query with optional parameters
   */
  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const start = Date.now();
    const client = await this.pool.connect();

    try {
      const result = await client.query(text, params);
      const duration = Date.now() - start;

      logger.debug('Executed query', {
        query: text,
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

  /**
   * Execute a query and return the first row
   */
  async queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
    const result = await this.query<T>(text, params);
    return result[0] || null;
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction<T>(
    callback: (query: (text: string, params?: any[]) => Promise<any[]>) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const transactionQuery = async (text: string, params?: any[]) => {
        const result = await client.query(text, params);
        return result.rows;
      };

      const result = await callback(transactionQuery);
      await client.query('COMMIT');

      logger.debug('Transaction completed successfully');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction rolled back due to error', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      logger.info('Database connection test successful');
      return true;
    } catch (error) {
      logger.error('Database connection test failed', error);
      return false;
    }
  }

  /**
   * Close all connections in the pool
   */
  async close(): Promise<void> {
    await this.pool.end();
    logger.info('Database pool closed');
  }
}

// Export singleton instance
export const db = new Database();
