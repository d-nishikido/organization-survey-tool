import { PoolClient } from 'pg';
import { db } from '../config/database';
import { logger } from '../utils/logger';
import { ITransaction } from '../repositories/interfaces';

export enum IsolationLevel {
  READ_UNCOMMITTED = 'READ UNCOMMITTED',
  READ_COMMITTED = 'READ COMMITTED',
  REPEATABLE_READ = 'REPEATABLE READ',
  SERIALIZABLE = 'SERIALIZABLE',
}

export interface TransactionOptions {
  isolationLevel?: IsolationLevel;
  readOnly?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export class Transaction implements ITransaction {
  private client: PoolClient;
  private isActive: boolean = false;

  constructor(client: PoolClient) {
    this.client = client;
  }

  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    if (!this.isActive) {
      throw new Error('Transaction is not active');
    }

    try {
      const result = await this.client.query(text, params);
      return result.rows;
    } catch (error) {
      logger.error('Transaction query error', { query: text, error });
      throw error;
    }
  }

  async queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
    const result = await this.query<T>(text, params);
    return result[0] || null;
  }

  async begin(options?: TransactionOptions): Promise<void> {
    if (this.isActive) {
      throw new Error('Transaction already active');
    }

    try {
      await this.client.query('BEGIN');
      
      if (options?.isolationLevel) {
        await this.client.query(`SET TRANSACTION ISOLATION LEVEL ${options.isolationLevel}`);
      }
      
      if (options?.readOnly) {
        await this.client.query('SET TRANSACTION READ ONLY');
      }

      this.isActive = true;
      logger.debug('Transaction started', { options });
    } catch (error) {
      logger.error('Failed to start transaction', error);
      throw error;
    }
  }

  async commit(): Promise<void> {
    if (!this.isActive) {
      throw new Error('No active transaction to commit');
    }

    try {
      await this.client.query('COMMIT');
      this.isActive = false;
      logger.debug('Transaction committed');
    } catch (error) {
      logger.error('Failed to commit transaction', error);
      this.isActive = false;
      throw error;
    }
  }

  async rollback(): Promise<void> {
    if (!this.isActive) {
      return; // Already rolled back or not started
    }

    try {
      await this.client.query('ROLLBACK');
      this.isActive = false;
      logger.debug('Transaction rolled back');
    } catch (error) {
      logger.error('Failed to rollback transaction', error);
      this.isActive = false;
      throw error;
    }
  }

  async savepoint(name: string): Promise<void> {
    if (!this.isActive) {
      throw new Error('No active transaction for savepoint');
    }

    await this.client.query(`SAVEPOINT ${name}`);
    logger.debug('Savepoint created', { name });
  }

  async rollbackToSavepoint(name: string): Promise<void> {
    if (!this.isActive) {
      throw new Error('No active transaction for savepoint rollback');
    }

    await this.client.query(`ROLLBACK TO SAVEPOINT ${name}`);
    logger.debug('Rolled back to savepoint', { name });
  }

  async releaseSavepoint(name: string): Promise<void> {
    if (!this.isActive) {
      throw new Error('No active transaction for savepoint release');
    }

    await this.client.query(`RELEASE SAVEPOINT ${name}`);
    logger.debug('Savepoint released', { name });
  }

  isTransactionActive(): boolean {
    return this.isActive;
  }

  release(): void {
    if (this.client) {
      this.client.release();
    }
  }
}

export class TransactionManager {
  private static instance: TransactionManager;

  static getInstance(): TransactionManager {
    if (!TransactionManager.instance) {
      TransactionManager.instance = new TransactionManager();
    }
    return TransactionManager.instance;
  }

  async withTransaction<T>(
    callback: (transaction: Transaction) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T> {
    const client = await db['pool'].connect();
    const transaction = new Transaction(client);

    try {
      await transaction.begin(options);
      const result = await callback(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      logger.error('Transaction failed and was rolled back', error);
      throw error;
    } finally {
      transaction.release();
    }
  }

  async withRetry<T>(
    operation: () => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const { maxRetries = 3, retryDelay = 100 } = options;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Check if it's a retryable error (deadlock, serialization failure, etc.)
        const isRetryable = this.isRetryableError(error as Error);
        
        if (!isRetryable || attempt === maxRetries) {
          logger.error('Operation failed after retries', { 
            attempt, 
            maxRetries, 
            error: lastError,
            retryable: isRetryable 
          });
          throw lastError;
        }

        const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        logger.warn('Retrying operation after error', { 
          attempt, 
          maxRetries, 
          delay, 
          error: lastError.message 
        });
        
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private isRetryableError(error: Error): boolean {
    const retryableCodes = [
      '40001', // serialization_failure
      '40P01', // deadlock_detected
      '53300', // too_many_connections
      '08006', // connection_failure
    ];

    const pgError = error as any;
    return retryableCodes.includes(pgError.code);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async createTransaction(options?: TransactionOptions): Promise<Transaction> {
    const client = await db['pool'].connect();
    const transaction = new Transaction(client);
    await transaction.begin(options);
    return transaction;
  }
}