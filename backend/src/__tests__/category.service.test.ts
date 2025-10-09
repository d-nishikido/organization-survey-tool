import { CategoryService } from '../services/category.service';
import { CategoryRepository } from '../repositories/category.repository';
import { NotFoundError, ConflictError, ValidationError } from '../types/error.types';
import { logger } from '../utils/logger';

// Mock the repository
jest.mock('../repositories/category.repository');

// Mock the logger
jest.mock('../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('CategoryService', () => {
  let categoryService: CategoryService;
  let mockCategoryRepository: jest.Mocked<CategoryRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    categoryService = new CategoryService();
    mockCategoryRepository = (categoryService as any).categoryRepository;
  });

  describe('getAllCategories', () => {
    it('active=trueの場合、有効なカテゴリのみを取得すること', async () => {
      const mockCategories = [
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

      mockCategoryRepository.findActiveWithQuestionCount.mockResolvedValue(mockCategories);

      const result = await categoryService.getAllCategories(true);

      expect(mockCategoryRepository.findActiveWithQuestionCount).toHaveBeenCalled();
      expect(result).toEqual(mockCategories);
    });

    it('active=falseの場合、全カテゴリを取得すること', async () => {
      const mockCategories = [
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
          is_active: false,
          created_at: new Date(),
          updated_at: new Date(),
          question_count: 0,
        },
      ];

      mockCategoryRepository.findAllWithQuestionCount.mockResolvedValue(mockCategories);

      const result = await categoryService.getAllCategories(false);

      expect(mockCategoryRepository.findAllWithQuestionCount).toHaveBeenCalled();
      expect(result).toEqual(mockCategories);
    });

    it('active未指定の場合、全カテゴリを取得すること', async () => {
      const mockCategories = [
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

      mockCategoryRepository.findAllWithQuestionCount.mockResolvedValue(mockCategories);

      const result = await categoryService.getAllCategories();

      expect(mockCategoryRepository.findAllWithQuestionCount).toHaveBeenCalled();
      expect(result).toEqual(mockCategories);
    });
  });

  describe('getCategoryById', () => {
    it('指定IDのカテゴリを取得できること', async () => {
      const mockCategory = {
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

      mockCategoryRepository.findByIdWithQuestionCount.mockResolvedValue(mockCategory);

      const result = await categoryService.getCategoryById(1);

      expect(mockCategoryRepository.findByIdWithQuestionCount).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockCategory);
    });

    it('存在しないIDの場合はNotFoundErrorをスローすること', async () => {
      mockCategoryRepository.findByIdWithQuestionCount.mockResolvedValue(null);

      await expect(categoryService.getCategoryById(999)).rejects.toThrow(NotFoundError);
      await expect(categoryService.getCategoryById(999)).rejects.toThrow('カテゴリ ID 999 が見つかりません');
    });
  });

  describe('createCategory', () => {
    const validCategoryData = {
      code: 'H',
      name: '新しいカテゴリ',
      description: 'テスト説明',
      display_order: 8,
    };

    it('新しいカテゴリを作成できること', async () => {
      const createdCategory = {
        id: 10,
        ...validCategoryData,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockCategoryRepository.findByCode.mockResolvedValue(null);
      mockCategoryRepository.create.mockResolvedValue(createdCategory);

      const result = await categoryService.createCategory(validCategoryData);

      expect(mockCategoryRepository.findByCode).toHaveBeenCalledWith('H');
      expect(mockCategoryRepository.create).toHaveBeenCalledWith({
        ...validCategoryData,
        is_active: true,
      });
      expect(result).toEqual(createdCategory);
      expect(logger.info).toHaveBeenCalledWith('Category created', {
        categoryId: 10,
        code: 'H',
        name: '新しいカテゴリ',
      });
    });

    it('コードが重複している場合はConflictErrorをスローすること', async () => {
      const existingCategory = {
        id: 1,
        code: 'A',
        name: '仕事について',
        description: null,
        display_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockCategoryRepository.findByCode.mockResolvedValue(existingCategory);

      await expect(
        categoryService.createCategory({ ...validCategoryData, code: 'A' })
      ).rejects.toThrow(ConflictError);

      await expect(
        categoryService.createCategory({ ...validCategoryData, code: 'A' })
      ).rejects.toThrow("カテゴリコード 'A' は既に使用されています");

      expect(mockCategoryRepository.create).not.toHaveBeenCalled();
    });

    it('is_activeを明示的に指定できること', async () => {
      const categoryDataWithInactive = {
        ...validCategoryData,
        is_active: false,
      };

      const createdCategory = {
        id: 10,
        ...categoryDataWithInactive,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockCategoryRepository.findByCode.mockResolvedValue(null);
      mockCategoryRepository.create.mockResolvedValue(createdCategory);

      const result = await categoryService.createCategory(categoryDataWithInactive);

      expect(mockCategoryRepository.create).toHaveBeenCalledWith(categoryDataWithInactive);
      expect(result.is_active).toBe(false);
    });
  });

  describe('updateCategory', () => {
    it('カテゴリ情報を更新できること', async () => {
      const updateData = {
        name: '更新後の名前',
        description: '更新後の説明',
      };

      const existingCategory = {
        id: 1,
        code: 'A',
        name: '仕事について',
        description: null,
        display_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const updatedCategory = {
        ...existingCategory,
        ...updateData,
        updated_at: new Date(),
      };

      mockCategoryRepository.findById.mockResolvedValue(existingCategory);
      mockCategoryRepository.update.mockResolvedValue(updatedCategory);

      const result = await categoryService.updateCategory(1, updateData);

      expect(mockCategoryRepository.findById).toHaveBeenCalledWith(1);
      expect(mockCategoryRepository.update).toHaveBeenCalledWith(1, updateData);
      expect(result).toEqual(updatedCategory);
      expect(logger.info).toHaveBeenCalledWith('Category updated', {
        categoryId: 1,
        updatedFields: Object.keys(updateData),
      });
    });

    it('存在しないカテゴリの場合はNotFoundErrorをスローすること', async () => {
      const updateData = { name: '更新後の名前' };

      mockCategoryRepository.findById.mockResolvedValue(null);

      await expect(categoryService.updateCategory(999, updateData)).rejects.toThrow(NotFoundError);
      await expect(categoryService.updateCategory(999, updateData)).rejects.toThrow(
        'カテゴリ ID 999 が見つかりません'
      );

      expect(mockCategoryRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteCategory', () => {
    it('関連質問がないカテゴリを削除できること', async () => {
      const existingCategory = {
        id: 1,
        code: 'A',
        name: '仕事について',
        description: null,
        display_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockCategoryRepository.findById.mockResolvedValue(existingCategory);
      mockCategoryRepository.countRelatedQuestions.mockResolvedValue(0);
      mockCategoryRepository.delete.mockResolvedValue(undefined);

      await categoryService.deleteCategory(1);

      expect(mockCategoryRepository.findById).toHaveBeenCalledWith(1);
      expect(mockCategoryRepository.countRelatedQuestions).toHaveBeenCalledWith(1);
      expect(mockCategoryRepository.delete).toHaveBeenCalledWith(1);
      expect(logger.info).toHaveBeenCalledWith('Category deleted', {
        categoryId: 1,
        categoryCode: 'A',
        relatedQuestionsAffected: 0,
      });
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('関連質問があるカテゴリを削除する場合は警告ログを出力すること', async () => {
      const existingCategory = {
        id: 1,
        code: 'A',
        name: '仕事について',
        description: null,
        display_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockCategoryRepository.findById.mockResolvedValue(existingCategory);
      mockCategoryRepository.countRelatedQuestions.mockResolvedValue(5);
      mockCategoryRepository.delete.mockResolvedValue(undefined);

      await categoryService.deleteCategory(1);

      expect(logger.warn).toHaveBeenCalledWith('Deleting category with related questions', {
        categoryId: 1,
        categoryCode: 'A',
        categoryName: '仕事について',
        relatedQuestions: 5,
      });
      expect(mockCategoryRepository.delete).toHaveBeenCalledWith(1);
      expect(logger.info).toHaveBeenCalledWith('Category deleted', {
        categoryId: 1,
        categoryCode: 'A',
        relatedQuestionsAffected: 5,
      });
    });

    it('存在しないカテゴリの場合はNotFoundErrorをスローすること', async () => {
      mockCategoryRepository.findById.mockResolvedValue(null);

      await expect(categoryService.deleteCategory(999)).rejects.toThrow(NotFoundError);
      await expect(categoryService.deleteCategory(999)).rejects.toThrow(
        'カテゴリ ID 999 が見つかりません'
      );

      expect(mockCategoryRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('toggleCategoryStatus', () => {
    it('カテゴリのステータスを切り替えられること', async () => {
      const existingCategory = {
        id: 1,
        code: 'A',
        name: '仕事について',
        description: null,
        display_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const toggledCategory = {
        ...existingCategory,
        is_active: false,
        updated_at: new Date(),
      };

      mockCategoryRepository.findById.mockResolvedValue(existingCategory);
      mockCategoryRepository.toggleStatus.mockResolvedValue(toggledCategory);

      const result = await categoryService.toggleCategoryStatus(1);

      expect(mockCategoryRepository.findById).toHaveBeenCalledWith(1);
      expect(mockCategoryRepository.toggleStatus).toHaveBeenCalledWith(1);
      expect(result).toEqual(toggledCategory);
      expect(logger.info).toHaveBeenCalledWith('Category status toggled', {
        categoryId: 1,
        categoryCode: 'A',
        newStatus: false,
      });
    });

    it('存在しないカテゴリの場合はNotFoundErrorをスローすること', async () => {
      mockCategoryRepository.findById.mockResolvedValue(null);

      await expect(categoryService.toggleCategoryStatus(999)).rejects.toThrow(NotFoundError);
      await expect(categoryService.toggleCategoryStatus(999)).rejects.toThrow(
        'カテゴリ ID 999 が見つかりません'
      );

      expect(mockCategoryRepository.toggleStatus).not.toHaveBeenCalled();
    });
  });

  describe('reorderCategories', () => {
    it('カテゴリの並び順を変更できること', async () => {
      const orderedIds = [3, 1, 2];

      mockCategoryRepository.exists
        .mockResolvedValueOnce(true)  // id: 3
        .mockResolvedValueOnce(true)  // id: 1
        .mockResolvedValueOnce(true); // id: 2

      mockCategoryRepository.reorder.mockResolvedValue(undefined);

      await categoryService.reorderCategories(orderedIds);

      expect(mockCategoryRepository.exists).toHaveBeenCalledTimes(3);
      expect(mockCategoryRepository.reorder).toHaveBeenCalledWith(orderedIds);
      expect(logger.info).toHaveBeenCalledWith('Categories reordered', {
        categoryIds: orderedIds,
        count: 3,
      });
    });

    it('存在しないIDが含まれる場合はValidationErrorをスローすること', async () => {
      const orderedIds = [1, 999, 2];

      mockCategoryRepository.exists
        .mockResolvedValueOnce(true)   // id: 1
        .mockResolvedValueOnce(false)  // id: 999
        .mockResolvedValueOnce(true);  // id: 2

      await expect(categoryService.reorderCategories(orderedIds)).rejects.toThrow(ValidationError);
      await expect(categoryService.reorderCategories(orderedIds)).rejects.toThrow(
        '存在しないカテゴリIDが含まれています: [999]'
      );

      expect(mockCategoryRepository.reorder).not.toHaveBeenCalled();
    });

    it('複数の存在しないIDが含まれる場合は全て報告すること', async () => {
      const orderedIds = [1, 999, 2, 888];

      mockCategoryRepository.exists
        .mockResolvedValueOnce(true)   // id: 1
        .mockResolvedValueOnce(false)  // id: 999
        .mockResolvedValueOnce(true)   // id: 2
        .mockResolvedValueOnce(false); // id: 888

      await expect(categoryService.reorderCategories(orderedIds)).rejects.toThrow(
        '存在しないカテゴリIDが含まれています: [999, 888]'
      );

      expect(mockCategoryRepository.reorder).not.toHaveBeenCalled();
    });

    it('空の配列でも正常に処理できること', async () => {
      const orderedIds: number[] = [];

      mockCategoryRepository.reorder.mockResolvedValue(undefined);

      await categoryService.reorderCategories(orderedIds);

      expect(mockCategoryRepository.exists).not.toHaveBeenCalled();
      expect(mockCategoryRepository.reorder).toHaveBeenCalledWith(orderedIds);
    });
  });
});
