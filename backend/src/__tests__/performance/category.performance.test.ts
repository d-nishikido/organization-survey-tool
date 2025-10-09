import { CategoryService } from '../../services/category.service';
import { CategoryRepository } from '../../repositories/category.repository';

// Mock the repository
jest.mock('../../repositories/category.repository');
jest.mock('../../utils/logger');

describe('Category Performance Tests', () => {
  let categoryService: CategoryService;
  let mockCategoryRepository: jest.Mocked<CategoryRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    categoryService = new CategoryService();
    mockCategoryRepository = (categoryService as any).categoryRepository;
  });

  describe('11.1 パフォーマンス目標の検証', () => {
    describe('カテゴリ一覧取得（100件）', () => {
      it('500ms以内に完了すること', async () => {
        // 100件のモックデータを生成
        const mockCategories = Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          code: `C${i + 1}`,
          name: `カテゴリ${i + 1}`,
          description: `説明${i + 1}`,
          display_order: i + 1,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          question_count: Math.floor(Math.random() * 20),
        }));

        mockCategoryRepository.findAllWithQuestionCount.mockResolvedValue(mockCategories);

        const startTime = performance.now();
        const result = await categoryService.getAllCategories();
        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(result).toHaveLength(100);
        expect(duration).toBeLessThan(500); // 500ms以内
      });

      it('大量データ（1000件）でも妥当な時間で完了すること', async () => {
        const mockCategories = Array.from({ length: 1000 }, (_, i) => ({
          id: i + 1,
          code: `C${i + 1}`,
          name: `カテゴリ${i + 1}`,
          description: `説明${i + 1}`,
          display_order: i + 1,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          question_count: Math.floor(Math.random() * 20),
        }));

        mockCategoryRepository.findAllWithQuestionCount.mockResolvedValue(mockCategories);

        const startTime = performance.now();
        const result = await categoryService.getAllCategories();
        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(result).toHaveLength(1000);
        expect(duration).toBeLessThan(2000); // 2秒以内
      });
    });

    describe('カテゴリ作成', () => {
      it('1秒以内に完了すること', async () => {
        const newCategory = {
          code: 'PERF',
          name: 'パフォーマンステスト',
          description: 'テスト用カテゴリ',
          display_order: 1,
        };

        const createdCategory = {
          id: 1,
          ...newCategory,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        };

        mockCategoryRepository.findByCode.mockResolvedValue(null);
        mockCategoryRepository.create.mockResolvedValue(createdCategory);

        const startTime = performance.now();
        const result = await categoryService.createCategory(newCategory);
        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(result).toEqual(createdCategory);
        expect(duration).toBeLessThan(1000); // 1秒以内
      });
    });

    describe('カテゴリ更新', () => {
      it('1秒以内に完了すること', async () => {
        const updateData = {
          name: '更新後の名前',
          description: '更新後の説明',
        };

        const existingCategory = {
          id: 1,
          code: 'PERF',
          name: 'パフォーマンステスト',
          description: 'テスト用カテゴリ',
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

        const startTime = performance.now();
        const result = await categoryService.updateCategory(1, updateData);
        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(result).toEqual(updatedCategory);
        expect(duration).toBeLessThan(1000); // 1秒以内
      });
    });

    describe('並び替え（50件）', () => {
      it('1秒以内に完了すること', async () => {
        const orderedIds = Array.from({ length: 50 }, (_, i) => i + 1).reverse();

        // 全IDが存在する
        mockCategoryRepository.exists.mockResolvedValue(true);
        mockCategoryRepository.reorder.mockResolvedValue(undefined);

        const startTime = performance.now();
        await categoryService.reorderCategories(orderedIds);
        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(mockCategoryRepository.reorder).toHaveBeenCalledWith(orderedIds);
        expect(duration).toBeLessThan(1000); // 1秒以内
      });

      it('大量並び替え（100件）でも妥当な時間で完了すること', async () => {
        const orderedIds = Array.from({ length: 100 }, (_, i) => i + 1).reverse();

        mockCategoryRepository.exists.mockResolvedValue(true);
        mockCategoryRepository.reorder.mockResolvedValue(undefined);

        const startTime = performance.now();
        await categoryService.reorderCategories(orderedIds);
        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(mockCategoryRepository.reorder).toHaveBeenCalledWith(orderedIds);
        expect(duration).toBeLessThan(2000); // 2秒以内
      });
    });

    describe('同時実行負荷テスト', () => {
      it('5ユーザーの同時アクセスを処理できること', async () => {
        const mockCategories = Array.from({ length: 50 }, (_, i) => ({
          id: i + 1,
          code: `C${i + 1}`,
          name: `カテゴリ${i + 1}`,
          description: null,
          display_order: i + 1,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          question_count: 5,
        }));

        mockCategoryRepository.findAllWithQuestionCount.mockResolvedValue(mockCategories);

        // 5つの同時リクエストをシミュレート
        const requests = Array.from({ length: 5 }, () =>
          categoryService.getAllCategories()
        );

        const startTime = performance.now();
        const results = await Promise.all(requests);
        const endTime = performance.now();
        const duration = endTime - startTime;

        // 全てのリクエストが成功
        expect(results).toHaveLength(5);
        results.forEach(result => {
          expect(result).toHaveLength(50);
        });

        // 合計時間が妥当（5リクエスト並列で2秒以内）
        expect(duration).toBeLessThan(2000);
      });

      it('10ユーザーの同時作成リクエストを処理できること', async () => {
        const createRequests = Array.from({ length: 10 }, (_, i) => ({
          code: `LOAD${i}`,
          name: `負荷テスト${i}`,
          description: `同時作成テスト ${i}`,
          display_order: i + 1,
        }));

        mockCategoryRepository.findByCode.mockResolvedValue(null);
        
        // 各リクエストに対して異なるIDのカテゴリを返す
        let callCount = 0;
        mockCategoryRepository.create.mockImplementation(async (data) => ({
          id: ++callCount,
          ...data,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        }));

        const startTime = performance.now();
        const results = await Promise.all(
          createRequests.map(data => categoryService.createCategory(data))
        );
        const endTime = performance.now();
        const duration = endTime - startTime;

        // 全てのリクエストが成功
        expect(results).toHaveLength(10);
        results.forEach((result, i) => {
          expect(result.code).toBe(`LOAD${i}`);
        });

        // 合計時間が妥当（10リクエスト並列で3秒以内）
        expect(duration).toBeLessThan(3000);
      });
    });

    describe('メモリ使用量の検証', () => {
      it('大量データ処理時にメモリリークが発生しないこと', async () => {
        const iterations = 100;
        const mockCategories = Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          code: `C${i + 1}`,
          name: `カテゴリ${i + 1}`,
          description: null,
          display_order: i + 1,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          question_count: 5,
        }));

        mockCategoryRepository.findAllWithQuestionCount.mockResolvedValue(mockCategories);

        const initialMemory = process.memoryUsage().heapUsed;

        // 100回繰り返し実行
        for (let i = 0; i < iterations; i++) {
          await categoryService.getAllCategories();
        }

        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = finalMemory - initialMemory;
        const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

        // メモリ増加が50MB以下であることを確認（メモリリークがないこと）
        expect(memoryIncreaseMB).toBeLessThan(50);
      });
    });
  });
});
