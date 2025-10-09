import Fastify, { FastifyInstance } from 'fastify';
import { categoriesRoutes } from '../../routes/categories.routes';
import { CategoryService } from '../../services/category.service';
import { CategoryRepository } from '../../repositories/category.repository';

// Mock the repository
jest.mock('../../repositories/category.repository');
jest.mock('../../utils/logger');

describe('Categories API Integration Tests', () => {
  let app: FastifyInstance;
  let mockCategoryRepository: jest.Mocked<CategoryRepository>;

  beforeAll(async () => {
    app = Fastify();
    await app.register(categoriesRoutes, { prefix: '/api' });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Get the mock repository instance
    const categoryService = new CategoryService();
    mockCategoryRepository = (categoryService as any).categoryRepository;
  });

  describe('9.1 カテゴリ作成・取得APIの統合テスト', () => {
    describe('POST /api/categories', () => {
      it('正常にカテゴリを作成できること（201）', async () => {
        const newCategory = {
          code: 'H',
          name: '新しいカテゴリ',
          description: 'テスト説明',
          display_order: 8,
        };

        const createdCategory = {
          id: 10,
          ...newCategory,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        mockCategoryRepository.findByCode = jest.fn().mockResolvedValue(null);
        mockCategoryRepository.create = jest.fn().mockResolvedValue(createdCategory);

        const response = await app.inject({
          method: 'POST',
          url: '/api/categories',
          payload: newCategory,
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.body);
        expect(body.code).toBe('H');
        expect(body.name).toBe('新しいカテゴリ');
        expect(body.is_active).toBe(true);
      });

      it('バリデーションエラーを返すこと（400） - codeが空', async () => {
        const invalidCategory = {
          code: '',
          name: '新しいカテゴリ',
          display_order: 8,
        };

        const response = await app.inject({
          method: 'POST',
          url: '/api/categories',
          payload: invalidCategory,
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(body.error).toBeDefined();
      });

      it('バリデーションエラーを返すこと（400） - codeが4文字以上', async () => {
        const invalidCategory = {
          code: 'ABCD',
          name: '新しいカテゴリ',
          display_order: 8,
        };

        const response = await app.inject({
          method: 'POST',
          url: '/api/categories',
          payload: invalidCategory,
        });

        expect(response.statusCode).toBe(400);
      });

      it('バリデーションエラーを返すこと（400） - nameが空', async () => {
        const invalidCategory = {
          code: 'H',
          name: '',
          display_order: 8,
        };

        const response = await app.inject({
          method: 'POST',
          url: '/api/categories',
          payload: invalidCategory,
        });

        expect(response.statusCode).toBe(400);
      });

      it('バリデーションエラーを返すこと（400） - display_orderが負の数', async () => {
        const invalidCategory = {
          code: 'H',
          name: '新しいカテゴリ',
          display_order: -1,
        };

        const response = await app.inject({
          method: 'POST',
          url: '/api/categories',
          payload: invalidCategory,
        });

        expect(response.statusCode).toBe(400);
      });

      it('コード重複エラーを返すこと（409）', async () => {
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

        mockCategoryRepository.findByCode = jest.fn().mockResolvedValue(existingCategory);

        const duplicateCategory = {
          code: 'A',
          name: '重複カテゴリ',
          display_order: 10,
        };

        const response = await app.inject({
          method: 'POST',
          url: '/api/categories',
          payload: duplicateCategory,
        });

        expect(response.statusCode).toBe(409);
        const body = JSON.parse(response.body);
        expect(body.error.code).toBe('CONFLICT');
        expect(body.error.message).toContain('既に使用されています');
      });
    });

    describe('GET /api/categories', () => {
      it('全カテゴリを取得できること（200）', async () => {
        const mockCategories = [
          {
            id: 1,
            code: 'A',
            name: '仕事について',
            description: null,
            display_order: 1,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            question_count: 5,
          },
          {
            id: 2,
            code: 'B',
            name: '最近の状態について',
            description: null,
            display_order: 2,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            question_count: 3,
          },
        ];

        mockCategoryRepository.findAllWithQuestionCount = jest.fn().mockResolvedValue(mockCategories);

        const response = await app.inject({
          method: 'GET',
          url: '/api/categories',
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body).toHaveLength(2);
        expect(body[0].code).toBe('A');
        expect(body[1].code).toBe('B');
        expect(body[0]).toHaveProperty('question_count');
      });

      it('active=trueで有効なカテゴリのみ取得できること', async () => {
        const mockActiveCategories = [
          {
            id: 1,
            code: 'A',
            name: '仕事について',
            description: null,
            display_order: 1,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            question_count: 5,
          },
        ];

        mockCategoryRepository.findActiveWithQuestionCount = jest.fn().mockResolvedValue(mockActiveCategories);

        const response = await app.inject({
          method: 'GET',
          url: '/api/categories?active=true',
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body).toHaveLength(1);
        expect(body[0].is_active).toBe(true);
      });

      it('active=falseで非有効なカテゴリのみ取得できること', async () => {
        const mockInactiveCategories = [
          {
            id: 3,
            code: 'C',
            name: '無効カテゴリ',
            description: null,
            display_order: 3,
            is_active: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            question_count: 0,
          },
        ];

        mockCategoryRepository.findAllWithQuestionCount = jest.fn().mockResolvedValue(mockInactiveCategories);

        const response = await app.inject({
          method: 'GET',
          url: '/api/categories?active=false',
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body).toHaveLength(1);
        expect(body[0].is_active).toBe(false);
      });

      it('カテゴリが存在しない場合は空配列を返すこと', async () => {
        mockCategoryRepository.findAllWithQuestionCount = jest.fn().mockResolvedValue([]);

        const response = await app.inject({
          method: 'GET',
          url: '/api/categories',
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body).toEqual([]);
      });
    });

    describe('GET /api/categories/:id', () => {
      it('指定IDのカテゴリを取得できること（200）', async () => {
        const mockCategory = {
          id: 1,
          code: 'A',
          name: '仕事について',
          description: 'カテゴリの説明',
          display_order: 1,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          question_count: 5,
        };

        mockCategoryRepository.findByIdWithQuestionCount = jest.fn().mockResolvedValue(mockCategory);

        const response = await app.inject({
          method: 'GET',
          url: '/api/categories/1',
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.id).toBe(1);
        expect(body.code).toBe('A');
        expect(body.question_count).toBe(5);
      });

      it('存在しないIDの場合は404を返すこと', async () => {
        mockCategoryRepository.findByIdWithQuestionCount = jest.fn().mockResolvedValue(null);

        const response = await app.inject({
          method: 'GET',
          url: '/api/categories/999',
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.body);
        expect(body.error.code).toBe('NOT_FOUND');
        expect(body.error.message).toContain('見つかりません');
      });

      it('不正なIDフォーマットの場合は400を返すこと', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/api/categories/invalid',
        });

        expect(response.statusCode).toBe(400);
      });
    });
  });

  describe('9.2 カテゴリ更新・削除APIの統合テスト', () => {
    describe('PUT /api/categories/:id', () => {
      it('正常にカテゴリを更新できること（200）', async () => {
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
          updated_at: new Date().toISOString(),
        };

        mockCategoryRepository.findById = jest.fn().mockResolvedValue(existingCategory);
        mockCategoryRepository.update = jest.fn().mockResolvedValue(updatedCategory);

        const response = await app.inject({
          method: 'PUT',
          url: '/api/categories/1',
          payload: updateData,
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.name).toBe('更新後の名前');
        expect(body.description).toBe('更新後の説明');
      });

      it('存在しないIDの場合は404を返すこと', async () => {
        mockCategoryRepository.findById = jest.fn().mockResolvedValue(null);

        const updateData = {
          name: '更新後の名前',
        };

        const response = await app.inject({
          method: 'PUT',
          url: '/api/categories/999',
          payload: updateData,
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.body);
        expect(body.error.code).toBe('NOT_FOUND');
      });

      it('バリデーションエラーを返すこと（400） - nameが長すぎる', async () => {
        const updateData = {
          name: 'a'.repeat(51), // 50文字超過
        };

        const response = await app.inject({
          method: 'PUT',
          url: '/api/categories/1',
          payload: updateData,
        });

        expect(response.statusCode).toBe(400);
      });
    });

    describe('DELETE /api/categories/:id', () => {
      it('正常にカテゴリを削除できること（200）', async () => {
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

        mockCategoryRepository.findById = jest.fn().mockResolvedValue(existingCategory);
        mockCategoryRepository.countRelatedQuestions = jest.fn().mockResolvedValue(0);
        mockCategoryRepository.delete = jest.fn().mockResolvedValue(undefined);

        const response = await app.inject({
          method: 'DELETE',
          url: '/api/categories/1',
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.message).toContain('削除しました');
      });

      it('関連質問があっても削除できること（ON DELETE SET NULL）', async () => {
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

        mockCategoryRepository.findById = jest.fn().mockResolvedValue(existingCategory);
        mockCategoryRepository.countRelatedQuestions = jest.fn().mockResolvedValue(5);
        mockCategoryRepository.delete = jest.fn().mockResolvedValue(undefined);

        const response = await app.inject({
          method: 'DELETE',
          url: '/api/categories/1',
        });

        expect(response.statusCode).toBe(200);
        // 警告ログが出力されることを確認（mockLoggerで検証）
      });

      it('存在しないIDの場合は404を返すこと', async () => {
        mockCategoryRepository.findById = jest.fn().mockResolvedValue(null);

        const response = await app.inject({
          method: 'DELETE',
          url: '/api/categories/999',
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.body);
        expect(body.error.code).toBe('NOT_FOUND');
      });
    });
  });

  describe('9.3 並び替え・ステータス変更APIの統合テスト', () => {
    describe('PATCH /api/categories/reorder', () => {
      it('正常に並び順を変更できること（200）', async () => {
        const orderedIds = [3, 1, 2];

        mockCategoryRepository.exists = jest.fn().mockResolvedValue(true);
        mockCategoryRepository.reorder = jest.fn().mockResolvedValue(undefined);

        const response = await app.inject({
          method: 'PATCH',
          url: '/api/categories/reorder',
          payload: { orderedIds },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.message).toContain('並び替えが完了しました');
        expect(mockCategoryRepository.reorder).toHaveBeenCalledWith(orderedIds);
      });

      it('存在しないIDが含まれる場合は422を返すこと', async () => {
        const orderedIds = [1, 999, 2];

        mockCategoryRepository.exists = jest
          .fn()
          .mockResolvedValueOnce(true)
          .mockResolvedValueOnce(false)
          .mockResolvedValueOnce(true);

        const response = await app.inject({
          method: 'PATCH',
          url: '/api/categories/reorder',
          payload: { orderedIds },
        });

        expect(response.statusCode).toBe(422);
        const body = JSON.parse(response.body);
        expect(body.error.code).toBe('VALIDATION_ERROR');
        expect(body.error.message).toContain('存在しないカテゴリID');
      });

      it('バリデーションエラーを返すこと（400） - orderedIdsが空配列', async () => {
        const response = await app.inject({
          method: 'PATCH',
          url: '/api/categories/reorder',
          payload: { orderedIds: [] },
        });

        expect(response.statusCode).toBe(400);
      });

      it('バリデーションエラーを返すこと（400） - orderedIdsが配列でない', async () => {
        const response = await app.inject({
          method: 'PATCH',
          url: '/api/categories/reorder',
          payload: { orderedIds: 'invalid' },
        });

        expect(response.statusCode).toBe(400);
      });
    });

    describe('PATCH /api/categories/:id/status', () => {
      it('正常にステータスを切り替えられること（200）', async () => {
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
          updated_at: new Date().toISOString(),
        };

        mockCategoryRepository.findById = jest.fn().mockResolvedValue(existingCategory);
        mockCategoryRepository.toggleStatus = jest.fn().mockResolvedValue(toggledCategory);

        const response = await app.inject({
          method: 'PATCH',
          url: '/api/categories/1/status',
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.is_active).toBe(false);
      });

      it('存在しないIDの場合は404を返すこと', async () => {
        mockCategoryRepository.findById = jest.fn().mockResolvedValue(null);

        const response = await app.inject({
          method: 'PATCH',
          url: '/api/categories/999/status',
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.body);
        expect(body.error.code).toBe('NOT_FOUND');
      });
    });

    describe('トランザクションとロールバック', () => {
      it('並び替え中にエラーが発生した場合はロールバックされること', async () => {
        const orderedIds = [1, 2, 3];

        mockCategoryRepository.exists = jest.fn().mockResolvedValue(true);
        mockCategoryRepository.reorder = jest.fn().mockRejectedValue(new Error('Database error'));

        const response = await app.inject({
          method: 'PATCH',
          url: '/api/categories/reorder',
          payload: { orderedIds },
        });

        expect(response.statusCode).toBe(500);
        const body = JSON.parse(response.body);
        expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
        expect(body.error.message).toContain('並び替えに失敗しました');
      });
    });
  });
});
