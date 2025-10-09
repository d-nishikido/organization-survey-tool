import { BaseRepository } from './base.repository';
import { ITransaction } from './interfaces';
import { db } from '../config/database';

export interface CategoryEntity {
  id: number;
  code: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CategoryWithQuestionCount extends CategoryEntity {
  question_count: number;
}

export interface CreateCategoryData {
  code: string;
  name: string;
  description?: string;
  display_order: number;
  is_active?: boolean;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
}

export class CategoryRepository extends BaseRepository<CategoryEntity> {
  constructor(transaction?: ITransaction) {
    super('survey_categories', transaction);
  }

  /**
   * カテゴリコードで検索
   */
  async findByCode(code: string): Promise<CategoryEntity | null> {
    const query = 'SELECT * FROM survey_categories WHERE code = $1';
    return this.queryOne<CategoryEntity>(query, [code]);
  }

  /**
   * 有効なカテゴリのみ取得
   */
  async findActive(): Promise<CategoryEntity[]> {
    return this.findAll({
      where: { is_active: true },
      orderBy: [{ field: 'display_order', direction: 'ASC' }],
    });
  }

  /**
   * 関連質問数を含むカテゴリ一覧を取得
   */
  async findAllWithQuestionCount(): Promise<CategoryWithQuestionCount[]> {
    const query = `
      SELECT 
        sc.*,
        COALESCE(COUNT(q.id), 0) as question_count
      FROM survey_categories sc
      LEFT JOIN questions q ON sc.id = q.category_id
      GROUP BY sc.id
      ORDER BY sc.display_order ASC
    `;
    return this.query<CategoryWithQuestionCount>(query);
  }

  /**
   * 有効なカテゴリのみ、関連質問数を含めて取得
   */
  async findActiveWithQuestionCount(): Promise<CategoryWithQuestionCount[]> {
    const query = `
      SELECT 
        sc.*,
        COALESCE(COUNT(q.id), 0) as question_count
      FROM survey_categories sc
      LEFT JOIN questions q ON sc.id = q.category_id
      WHERE sc.is_active = true
      GROUP BY sc.id
      ORDER BY sc.display_order ASC
    `;
    return this.query<CategoryWithQuestionCount>(query);
  }

  /**
   * IDで検索（関連質問数を含む）
   */
  async findByIdWithQuestionCount(id: number): Promise<CategoryWithQuestionCount | null> {
    const query = `
      SELECT 
        sc.*,
        COALESCE(COUNT(q.id), 0) as question_count
      FROM survey_categories sc
      LEFT JOIN questions q ON sc.id = q.category_id
      WHERE sc.id = $1
      GROUP BY sc.id
    `;
    return this.queryOne<CategoryWithQuestionCount>(query, [id]);
  }

  /**
   * カテゴリに関連する質問数をカウント
   */
  async countRelatedQuestions(categoryId: number): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM questions WHERE category_id = $1';
    const result = await this.queryOne<{ count: string }>(query, [categoryId]);
    return parseInt(result?.count || '0', 10);
  }

  /**
   * カテゴリの有効/無効ステータスを切り替え
   */
  async toggleStatus(id: number): Promise<CategoryEntity | null> {
    const query = `
      UPDATE survey_categories
      SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    return this.queryOne<CategoryEntity>(query, [id]);
  }

  /**
   * 複数カテゴリの表示順序を一括更新（トランザクション内）
   */
  async reorder(orderedIds: number[]): Promise<void> {
    const connection = await db.pool.connect();
    try {
      await connection.query('BEGIN');

      for (let i = 0; i < orderedIds.length; i++) {
        await connection.query(
          'UPDATE survey_categories SET display_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [i + 1, orderedIds[i]]
        );
      }

      await connection.query('COMMIT');
    } catch (error) {
      await connection.query('ROLLBACK');
      throw error;
    } finally {
      connection.release();
    }
  }
}
