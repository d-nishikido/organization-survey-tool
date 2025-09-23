import { BaseRepository } from '../../repositories/base.repository';
import { ITransaction } from '../../repositories/interfaces';

// Mock the database module
jest.mock('../../config/database', () => ({
  db: {
    query: jest.fn(),
    queryOne: jest.fn(),
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

interface TestEntity {
  id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
}

class TestRepository extends BaseRepository<TestEntity> {
  constructor(transaction?: ITransaction) {
    super('test_table', transaction);
  }
}

describe('BaseRepository', () => {
  let repository: TestRepository;
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = require('../../config/database').db;
    repository = new TestRepository();
  });

  describe('findById', () => {
    it('should find entity by id', async () => {
      const mockEntity = { id: 1, name: 'Test', created_at: new Date(), updated_at: new Date() };
      mockDb.queryOne.mockResolvedValue(mockEntity);

      const result = await repository.findById(1);

      expect(mockDb.queryOne).toHaveBeenCalledWith(
        'SELECT * FROM test_table WHERE id = $1',
        [1]
      );
      expect(result).toEqual(mockEntity);
    });

    it('should return null when entity not found', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all entities without criteria', async () => {
      const mockEntities = [
        { id: 1, name: 'Test 1', created_at: new Date(), updated_at: new Date() },
        { id: 2, name: 'Test 2', created_at: new Date(), updated_at: new Date() },
      ];
      mockDb.query.mockResolvedValue(mockEntities);

      const result = await repository.findAll();

      expect(mockDb.query).toHaveBeenCalledWith('SELECT * FROM test_table', []);
      expect(result).toEqual(mockEntities);
    });

    it('should apply where criteria', async () => {
      const mockEntities = [
        { id: 1, name: 'Test 1', created_at: new Date(), updated_at: new Date() },
      ];
      mockDb.query.mockResolvedValue(mockEntities);

      const result = await repository.findAll({
        where: { name: 'Test 1' }
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM test_table WHERE name = $1',
        ['Test 1']
      );
      expect(result).toEqual(mockEntities);
    });

    it('should apply order by', async () => {
      const mockEntities: TestEntity[] = [];
      mockDb.query.mockResolvedValue(mockEntities);

      await repository.findAll({
        orderBy: [{ field: 'name', direction: 'ASC' }]
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM test_table ORDER BY name ASC',
        []
      );
    });

    it('should apply limit and offset', async () => {
      const mockEntities: TestEntity[] = [];
      mockDb.query.mockResolvedValue(mockEntities);

      await repository.findAll({
        limit: 10,
        offset: 20
      });

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM test_table LIMIT $1 OFFSET $2',
        [10, 20]
      );
    });
  });

  describe('create', () => {
    it('should create new entity', async () => {
      const newEntity = { name: 'New Test' };
      const createdEntity = { 
        id: 1, 
        name: 'New Test', 
        created_at: new Date(), 
        updated_at: new Date() 
      };
      mockDb.queryOne.mockResolvedValue(createdEntity);

      const result = await repository.create(newEntity);

      expect(mockDb.queryOne).toHaveBeenCalledWith(
        'INSERT INTO test_table (name)\n      VALUES ($1)\n      RETURNING *',
        ['New Test']
      );
      expect(result).toEqual(createdEntity);
    });

    it('should throw error when creation fails', async () => {
      const newEntity = { name: 'New Test' };
      mockDb.queryOne.mockResolvedValue(null);

      await expect(repository.create(newEntity)).rejects.toThrow(
        'Failed to create record in test_table'
      );
    });
  });

  describe('update', () => {
    it('should update entity', async () => {
      const updateData = { name: 'Updated Test' };
      const updatedEntity = { 
        id: 1, 
        name: 'Updated Test', 
        created_at: new Date(), 
        updated_at: new Date() 
      };
      mockDb.queryOne.mockResolvedValue(updatedEntity);

      const result = await repository.update(1, updateData);

      expect(mockDb.queryOne).toHaveBeenCalledWith(
        'UPDATE test_table\n      SET name = $2, updated_at = CURRENT_TIMESTAMP\n      WHERE id = $1\n      RETURNING *',
        [1, 'Updated Test']
      );
      expect(result).toEqual(updatedEntity);
    });

    it('should return current entity when no fields to update', async () => {
      const mockEntity = { id: 1, name: 'Test', created_at: new Date(), updated_at: new Date() };
      mockDb.queryOne.mockResolvedValue(mockEntity);

      const result = await repository.update(1, {});

      expect(mockDb.queryOne).toHaveBeenCalledWith(
        'SELECT * FROM test_table WHERE id = $1',
        [1]
      );
      expect(result).toEqual(mockEntity);
    });
  });

  describe('delete', () => {
    it('should delete entity', async () => {
      mockDb.query.mockResolvedValue([{ id: 1 }]);

      const result = await repository.delete(1);

      expect(mockDb.query).toHaveBeenCalledWith(
        'DELETE FROM test_table WHERE id = $1',
        [1]
      );
      expect(result).toBe(true);
    });

    it('should return false when entity not found', async () => {
      mockDb.query.mockResolvedValue([]);

      const result = await repository.delete(999);

      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true when entity exists', async () => {
      mockDb.queryOne.mockResolvedValue({ exists: true });

      const result = await repository.exists(1);

      expect(mockDb.queryOne).toHaveBeenCalledWith(
        'SELECT 1 FROM test_table WHERE id = $1 LIMIT 1',
        [1]
      );
      expect(result).toBe(true);
    });

    it('should return false when entity does not exist', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      const result = await repository.exists(999);

      expect(result).toBe(false);
    });
  });

  describe('count', () => {
    it('should count all entities', async () => {
      mockDb.queryOne.mockResolvedValue({ count: '5' });

      const result = await repository.count();

      expect(mockDb.queryOne).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM test_table',
        []
      );
      expect(result).toBe(5);
    });

    it('should count entities with criteria', async () => {
      mockDb.queryOne.mockResolvedValue({ count: '3' });

      const result = await repository.count({
        where: { name: 'Test' }
      });

      expect(mockDb.queryOne).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM test_table WHERE name = $1',
        ['Test']
      );
      expect(result).toBe(3);
    });
  });

  describe('with transaction', () => {
    it('should use transaction for queries', async () => {
      const mockTransaction: ITransaction = {
        query: jest.fn().mockResolvedValue([]),
        queryOne: jest.fn().mockResolvedValue({ id: 1, name: 'Test' }),
      };

      const transactionRepository = new TestRepository(mockTransaction);
      await transactionRepository.findById(1);

      expect(mockTransaction.queryOne).toHaveBeenCalledWith(
        'SELECT * FROM test_table WHERE id = $1',
        [1]
      );
      expect(mockDb.queryOne).not.toHaveBeenCalled();
    });
  });
});