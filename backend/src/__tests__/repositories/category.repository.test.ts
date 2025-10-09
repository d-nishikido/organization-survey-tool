import { CategoryRepository } from '../../repositories/category.repository';
import { ITransaction } from '../../repositories/interfaces';

// Mock the database module
jest.mock('../../config/database', () => ({
  db: {
    query: jest.fn(),
    queryOne: jest.fn(),
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

interface CategoryEntity {
  id: number;
  code: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface CategoryWithQuestionCount extends CategoryEntity {
  question_count: number;
}

describe('CategoryRepository', () => {
  let repository: CategoryRepository;
  let mockDb: any;
  let mockConnection: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = require('../../config/database').db;
    
    // Mock connection for transaction tests
    mockConnection = {
      query: jest.fn(),
      release: jest.fn(),
    };
    mockDb.pool.connect.mockResolvedValue(mockConnection);
    
    repository = new CategoryRepository();
  });

  describe('findAll', () => {
    it('全カテゴリをdisplay_order昇順で取得できること', async () => {
      const mockCategories: CategoryEntity[] = [
        {
          id: 1,
          code: 'A',
          name: '仕事について',
          description: null,
          display_order: 1,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          code: 'B',
          name: '最近の状態について',
          description: null,
          display_order: 2,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];
      mockDb.query.mockResolvedValue(mockCategories);

      const result = await repository.findAll();

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM survey_categories ORDER BY display_order ASC',
        []
      );
      expect(result).toEqual(mockCategories);
      expect(result[0].display_order).toBeLessThan(result[1].display_order);
    });

    it('カテゴリが存在しない場合は空配列を返すこと', async () => {
      mockDb.query.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByCode', () => {
    it('指定したコードでカテゴリを検索できること', async () => {
      const mockCategory: CategoryEntity = {
        id: 1,
        code: 'A',
        name: '仕事について',
        description: null,
        display_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockDb.queryOne.mockResolvedValue(mockCategory);

      const result = await repository.findByCode('A');

      expect(mockDb.queryOne).toHaveBeenCalledWith(
        'SELECT * FROM survey_categories WHERE code = $1',
        ['A']
      );
      expect(result).toEqual(mockCategory);
    });

    it('存在しないコードの場合はnullを返すこと', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      const result = await repository.findByCode('Z');

      expect(result).toBeNull();
    });
  });

  describe('findActive', () => {
    it('有効なカテゴリのみを取得できること', async () => {
      const mockActiveCategories: CategoryEntity[] = [
        {
          id: 1,
          code: 'A',
          name: '仕事について',
          description: null,
          display_order: 1,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];
      mockDb.query.mockResolvedValue(mockActiveCategories);

      const result = await repository.findActive();

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM survey_categories WHERE is_active = true ORDER BY display_order ASC',
        []
      );
      expect(result).toEqual(mockActiveCategories);
      expect(result.every(c => c.is_active)).toBe(true);
    });
  });

  describe('findAllWithQuestionCount', () => {
    it('関連質問数を含む全カテゴリを取得できること', async () => {
      const mockCategoriesWithCount: CategoryWithQuestionCount[] = [
        {
          id: 1,
          code: 'A',
          name: '仕事について',
          description: null,
          display_order: 1,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          question_count: 5,
        },
        {
          id: 2,
          code: 'B',
          name: '最近の状態について',
          description: null,
          display_order: 2,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          question_count: 0,
        },
      ];
      mockDb.query.mockResolvedValue(mockCategoriesWithCount);

      const result = await repository.findAllWithQuestionCount();

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('LEFT JOIN questions'),
        undefined
      );
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('GROUP BY sc.id'),
        undefined
      );
      expect(result).toEqual(mockCategoriesWithCount);
      expect(result[0]).toHaveProperty('question_count');
    });

    it('質問が紐づいていないカテゴリのquestion_countは0であること', async () => {
      const mockCategory: CategoryWithQuestionCount[] = [
        {
          id: 1,
          code: 'A',
          name: '仕事について',
          description: null,
          display_order: 1,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          question_count: 0,
        },
      ];
      mockDb.query.mockResolvedValue(mockCategory);

      const result = await repository.findAllWithQuestionCount();

      expect(result[0].question_count).toBe(0);
    });
  });

  describe('findActiveWithQuestionCount', () => {
    it('関連質問数を含む有効なカテゴリのみを取得できること', async () => {
      const mockActiveWithCount: CategoryWithQuestionCount[] = [
        {
          id: 1,
          code: 'A',
          name: '仕事について',
          description: null,
          display_order: 1,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          question_count: 5,
        },
      ];
      mockDb.query.mockResolvedValue(mockActiveWithCount);

      const result = await repository.findActiveWithQuestionCount();

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE sc.is_active = true'),
        undefined
      );
      expect(result).toEqual(mockActiveWithCount);
      expect(result.every(c => c.is_active)).toBe(true);
    });
  });

  describe('findByIdWithQuestionCount', () => {
    it('指定IDのカテゴリを関連質問数とともに取得できること', async () => {
      const mockCategory: CategoryWithQuestionCount = {
        id: 1,
        code: 'A',
        name: '仕事について',
        description: null,
        display_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        question_count: 5,
      };
      mockDb.queryOne.mockResolvedValue(mockCategory);

      const result = await repository.findByIdWithQuestionCount(1);

      expect(mockDb.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE sc.id = $1'),
        [1]
      );
      expect(result).toEqual(mockCategory);
      expect(result).toHaveProperty('question_count');
    });

    it('存在しないIDの場合はnullを返すこと', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      const result = await repository.findByIdWithQuestionCount(999);

      expect(result).toBeNull();
    });
  });

  describe('countRelatedQuestions', () => {
    it('指定カテゴリに紐づく質問数をカウントできること', async () => {
      mockDb.queryOne.mockResolvedValue({ count: '5' });

      const result = await repository.countRelatedQuestions(1);

      expect(mockDb.queryOne).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM questions WHERE category_id = $1',
        [1]
      );
      expect(result).toBe(5);
    });

    it('質問が紐づいていない場合は0を返すこと', async () => {
      mockDb.queryOne.mockResolvedValue({ count: '0' });

      const result = await repository.countRelatedQuestions(1);

      expect(result).toBe(0);
    });
  });

  describe('create', () => {
    it('デフォルト値を含む新しいカテゴリを作成できること', async () => {
      const newCategory = {
        code: 'H',
        name: '新しいカテゴリ',
        description: 'テスト説明',
        display_order: 8,
      };

      const createdCategory: CategoryEntity = {
        id: 10,
        ...newCategory,
        is_active: true, // デフォルト値
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.queryOne.mockResolvedValue(createdCategory);

      const result = await repository.create(newCategory);

      expect(mockDb.queryOne).toHaveBeenCalled();
      expect(result).toEqual(createdCategory);
      expect(result.is_active).toBe(true);
    });

    it('is_activeを明示的に指定した場合はその値が設定されること', async () => {
      const newCategory = {
        code: 'H',
        name: '新しいカテゴリ',
        description: 'テスト説明',
        display_order: 8,
        is_active: false,
      };

      const createdCategory: CategoryEntity = {
        id: 10,
        ...newCategory,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.queryOne.mockResolvedValue(createdCategory);

      const result = await repository.create(newCategory);

      expect(result.is_active).toBe(false);
    });
  });

  describe('toggleStatus', () => {
    it('カテゴリの有効/無効を切り替えられること', async () => {
      const toggledCategory: CategoryEntity = {
        id: 1,
        code: 'A',
        name: '仕事について',
        description: null,
        display_order: 1,
        is_active: false, // 切り替え後
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.queryOne.mockResolvedValue(toggledCategory);

      const result = await repository.toggleStatus(1);

      expect(mockDb.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('is_active = NOT is_active'),
        [1]
      );
      expect(result).toEqual(toggledCategory);
    });
  });

  describe('reorder', () => {
    it('複数カテゴリの並び順をトランザクション内で更新できること', async () => {
      const orderedIds = [3, 1, 2];
      
      mockConnection.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // UPDATE 1
        .mockResolvedValueOnce({ rows: [] }) // UPDATE 2
        .mockResolvedValueOnce({ rows: [] }) // UPDATE 3
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      await repository.reorder(orderedIds);

      expect(mockDb.pool.connect).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalledWith('BEGIN');
      expect(mockConnection.query).toHaveBeenCalledWith(
        'UPDATE survey_categories SET display_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [1, 3]
      );
      expect(mockConnection.query).toHaveBeenCalledWith(
        'UPDATE survey_categories SET display_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [2, 1]
      );
      expect(mockConnection.query).toHaveBeenCalledWith(
        'UPDATE survey_categories SET display_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [3, 2]
      );
      expect(mockConnection.query).toHaveBeenCalledWith('COMMIT');
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('並び替え中にエラーが発生した場合はロールバックすること', async () => {
      const orderedIds = [3, 1, 2];
      const mockError = new Error('Database error');

      mockConnection.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // UPDATE 1
        .mockRejectedValueOnce(mockError) // UPDATE 2 fails
        .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

      await expect(repository.reorder(orderedIds)).rejects.toThrow('Database error');

      expect(mockConnection.query).toHaveBeenCalledWith('BEGIN');
      expect(mockConnection.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('空の配列を渡しても正常に完了すること', async () => {
      const orderedIds: number[] = [];

      mockConnection.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      await repository.reorder(orderedIds);

      expect(mockConnection.query).toHaveBeenCalledWith('BEGIN');
      expect(mockConnection.query).toHaveBeenCalledWith('COMMIT');
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('カテゴリ情報を更新できること', async () => {
      const updateData = {
        name: '更新後の名前',
        description: '更新後の説明',
      };

      const updatedCategory: CategoryEntity = {
        id: 1,
        code: 'A',
        name: '更新後の名前',
        description: '更新後の説明',
        display_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.queryOne.mockResolvedValue(updatedCategory);

      const result = await repository.update(1, updateData);

      expect(result).toEqual(updatedCategory);
    });
  });

  describe('delete', () => {
    it('カテゴリを削除できること', async () => {
      mockDb.queryOne.mockResolvedValue({ id: 1 });

      await repository.delete(1);

      expect(mockDb.queryOne).toHaveBeenCalled();
    });
  });

  describe('exists', () => {
    it('カテゴリが存在する場合はtrueを返すこと', async () => {
      mockDb.queryOne.mockResolvedValue({ exists: true });

      const result = await repository.exists(1);

      expect(result).toBe(true);
    });

    it('カテゴリが存在しない場合はfalseを返すこと', async () => {
      mockDb.queryOne.mockResolvedValue({ exists: false });

      const result = await repository.exists(999);

      expect(result).toBe(false);
    });
  });
});
