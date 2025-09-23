import { TransactionManager, IsolationLevel, Transaction } from '../../database/transaction-manager';
import { PoolClient } from 'pg';

// Mock the database module
jest.mock('../../config/database', () => ({
  db: {
    pool: {
      connect: jest.fn(),
    },
  },
}));

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('TransactionManager', () => {
  let transactionManager: TransactionManager;
  let mockClient: jest.Mocked<PoolClient>;
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = require('../../config/database').db;
    
    mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    } as any;

    mockDb.pool.connect.mockResolvedValue(mockClient);
    transactionManager = TransactionManager.getInstance();
  });

  describe('withTransaction', () => {
    it('should execute callback within transaction and commit', async () => {
      const mockResult = { success: true };
      const callback = jest.fn().mockResolvedValue(mockResult);

      mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // COMMIT

      const result = await transactionManager.withTransaction(callback);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(callback).toHaveBeenCalledWith(expect.any(Transaction));
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should rollback transaction on error', async () => {
      const error = new Error('Test error');
      const callback = jest.fn().mockRejectedValue(error);

      mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // ROLLBACK

      await expect(transactionManager.withTransaction(callback)).rejects.toThrow('Test error');

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should set isolation level when provided', async () => {
      const callback = jest.fn().mockResolvedValue(true);

      mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // SET TRANSACTION ISOLATION LEVEL
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // COMMIT

      await transactionManager.withTransaction(callback, {
        isolationLevel: IsolationLevel.SERIALIZABLE
      });

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should set read only when provided', async () => {
      const callback = jest.fn().mockResolvedValue(true);

      mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // SET TRANSACTION READ ONLY
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // COMMIT

      await transactionManager.withTransaction(callback, {
        readOnly: true
      });

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('SET TRANSACTION READ ONLY');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await transactionManager.withRetry(operation);

      expect(operation).toHaveBeenCalledTimes(1);
      expect(result).toBe('success');
    });

    it('should retry on retryable error', async () => {
      const retryableError = new Error('Deadlock') as any;
      retryableError.code = '40P01'; // deadlock_detected

      const operation = jest.fn()
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValueOnce('success');

      const result = await transactionManager.withRetry(operation, { maxRetries: 3 });

      expect(operation).toHaveBeenCalledTimes(2);
      expect(result).toBe('success');
    });

    it('should not retry on non-retryable error', async () => {
      const nonRetryableError = new Error('Syntax error');

      const operation = jest.fn().mockRejectedValue(nonRetryableError);

      await expect(transactionManager.withRetry(operation)).rejects.toThrow('Syntax error');

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should give up after max retries', async () => {
      const retryableError = new Error('Deadlock') as any;
      retryableError.code = '40P01';

      const operation = jest.fn().mockRejectedValue(retryableError);

      await expect(transactionManager.withRetry(operation, { maxRetries: 2 }))
        .rejects.toThrow('Deadlock');

      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('Transaction', () => {
    let transaction: Transaction;

    beforeEach(() => {
      transaction = new Transaction(mockClient);
    });

    it('should execute queries when active', async () => {
      const mockRows = [{ id: 1, name: 'test' }];
      mockClient.query.mockResolvedValueOnce({ rows: mockRows } as any);

      // Start transaction
      await transaction.begin();

      const result = await transaction.query('SELECT * FROM test');

      expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM test', undefined);
      expect(result).toEqual(mockRows);
    });

    it('should throw error when query executed without active transaction', async () => {
      await expect(transaction.query('SELECT * FROM test'))
        .rejects.toThrow('Transaction is not active');
    });

    it('should handle savepoints', async () => {
      await transaction.begin();

      await transaction.savepoint('sp1');
      expect(mockClient.query).toHaveBeenCalledWith('SAVEPOINT sp1');

      await transaction.rollbackToSavepoint('sp1');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK TO SAVEPOINT sp1');

      await transaction.releaseSavepoint('sp1');
      expect(mockClient.query).toHaveBeenCalledWith('RELEASE SAVEPOINT sp1');
    });

    it('should track transaction state correctly', async () => {
      expect(transaction.isTransactionActive()).toBe(false);

      await transaction.begin();
      expect(transaction.isTransactionActive()).toBe(true);

      await transaction.commit();
      expect(transaction.isTransactionActive()).toBe(false);
    });
  });
});