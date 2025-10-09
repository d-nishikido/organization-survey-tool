import { logger } from '../utils/logger';
import { CategoryRepository, CategoryEntity, CategoryWithQuestionCount, CreateCategoryData, UpdateCategoryData } from '../repositories/category.repository';
import { NotFoundError, ConflictError, ValidationError } from '../types/error.types';
import { logger } from '../utils/logger';

export class CategoryService {
  private categoryRepository: CategoryRepository;

  constructor() {
    this.categoryRepository = new CategoryRepository();
  }

  /**
   * 全カテゴリを関連質問数付きで取得
   */
  async getAllCategories(activeOnly?: boolean): Promise<CategoryWithQuestionCount[]> {
    try {
      if (activeOnly === true) {
        return await this.categoryRepository.findActiveWithQuestionCount();
      } else if (activeOnly === false) {
        // 非アクティブのみを取得
        const allCategories = await this.categoryRepository.findAllWithQuestionCount();
        return allCategories.filter(cat => !cat.is_active);
      } else {
        // 全カテゴリ取得
        return await this.categoryRepository.findAllWithQuestionCount();
      }
    } catch (error) {
      logger.error('Failed to get categories', { error, activeOnly });
      throw error;
    }
  }

  /**
   * IDでカテゴリを取得（関連質問数付き）
   */
  async getCategoryById(id: number): Promise<CategoryWithQuestionCount> {
    const category = await this.categoryRepository.findByIdWithQuestionCount(id);
    
    if (!category) {
      throw new NotFoundError(`カテゴリ ID ${id} が見つかりません`);
    }

    return category;
  }

  /**
   * カテゴリを作成
   */
  async createCategory(data: CreateCategoryData): Promise<CategoryEntity> {
    // コード重複チェック
    const existingCategory = await this.categoryRepository.findByCode(data.code);
    if (existingCategory) {
      throw new ConflictError(
        `カテゴリコード '${data.code}' は既に使用されています`,
        { code: data.code }
      );
    }

    try {
      // デフォルト値の適用
      const categoryData = {
        ...data,
        is_active: data.is_active !== undefined ? data.is_active : true,
      };

      const newCategory = await this.categoryRepository.create(categoryData);
      
      logger.info('Category created', {
        categoryId: newCategory.id,
        code: newCategory.code,
        name: newCategory.name,
      });

      return newCategory;
    } catch (error) {
      logger.error('Failed to create category', { error, data });
      throw error;
    }
  }

  /**
   * カテゴリを更新
   */
  async updateCategory(id: number, data: UpdateCategoryData): Promise<CategoryEntity> {
    // カテゴリ存在確認
    const existingCategory = await this.categoryRepository.findById(id);
    if (!existingCategory) {
      throw new NotFoundError(`カテゴリ ID ${id} が見つかりません`);
    }

    try {
      const updatedCategory = await this.categoryRepository.update(id, data);
      
      if (!updatedCategory) {
        throw new NotFoundError(`カテゴリ ID ${id} の更新に失敗しました`);
      }

      logger.info('Category updated', {
        categoryId: id,
        updates: Object.keys(data),
      });

      return updatedCategory;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Failed to update category', { error, id, data });
      throw error;
    }
  }

  /**
   * カテゴリを削除
   */
  async deleteCategory(id: number): Promise<void> {
    // カテゴリ存在確認
    const existingCategory = await this.categoryRepository.findById(id);
    if (!existingCategory) {
      throw new NotFoundError(`カテゴリ ID ${id} が見つかりません`);
    }

    // 関連質問数を確認してログ記録
    const questionCount = await this.categoryRepository.countRelatedQuestions(id);
    if (questionCount > 0) {
      logger.warn('Deleting category with related questions', {
        categoryId: id,
        categoryCode: existingCategory.code,
        categoryName: existingCategory.name,
        relatedQuestions: questionCount,
      });
    }

    try {
      await this.categoryRepository.delete(id);
      
      logger.info('Category deleted', {
        categoryId: id,
        categoryCode: existingCategory.code,
        relatedQuestionsAffected: questionCount,
      });
    } catch (error) {
      logger.error('Failed to delete category', { error, id });
      throw error;
    }
  }

  /**
   * カテゴリの有効/無効を切り替え
   */
  async toggleCategoryStatus(id: number): Promise<CategoryEntity> {
    // カテゴリ存在確認
    const existingCategory = await this.categoryRepository.findById(id);
    if (!existingCategory) {
      throw new NotFoundError(`カテゴリ ID ${id} が見つかりません`);
    }

    try {
      const updatedCategory = await this.categoryRepository.toggleStatus(id);
      
      if (!updatedCategory) {
        throw new NotFoundError(`カテゴリ ID ${id} のステータス切り替えに失敗しました`);
      }

      logger.info('Category status toggled', {
        categoryId: id,
        oldStatus: existingCategory.is_active,
        newStatus: updatedCategory.is_active,
      });

      // ステータス無効化時、関連質問がある場合は警告
      if (!updatedCategory.is_active) {
        const questionCount = await this.categoryRepository.countRelatedQuestions(id);
        if (questionCount > 0) {
          logger.warn('Category deactivated with related questions', {
            categoryId: id,
            categoryCode: updatedCategory.code,
            relatedQuestions: questionCount,
          });
        }
      }

      return updatedCategory;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Failed to toggle category status', { error, id });
      throw error;
    }
  }

  /**
   * カテゴリの並び替え
   */
  async reorderCategories(orderedIds: number[]): Promise<void> {
    // 全IDの存在確認
    const invalidIds: number[] = [];
    for (const id of orderedIds) {
      const exists = await this.categoryRepository.exists(id);
      if (!exists) {
        invalidIds.push(id);
      }
    }

    if (invalidIds.length > 0) {
      throw new ValidationError(
        `存在しないカテゴリIDが含まれています: [${invalidIds.join(', ')}]`,
        { invalidIds }
      );
    }

    try {
      await this.categoryRepository.reorder(orderedIds);
      
      logger.info('Categories reordered', {
        categoriesCount: orderedIds.length,
        orderedIds,
      });
    } catch (error) {
      logger.error('Failed to reorder categories', { error, orderedIds });
      throw error;
    }
  }
}
