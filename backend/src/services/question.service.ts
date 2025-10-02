import { db } from '../config/database';
import { logger } from '../utils/logger';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  QuestionResponse,
  QuestionList,
  QuestionQuery,
} from '../types/question.types';

export class QuestionService {
  /**
   * Get all questions with pagination and filtering
   */
  async getAllQuestions(query: QuestionQuery): Promise<QuestionList> {
    const { page = 1, pageSize = 10, category, type, search } = query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    // Add category filter
    if (category) {
      paramCount++;
      whereClause += ` AND sc.code = $${paramCount}`;
      params.push(category);
    }

    // Add type filter
    if (type) {
      paramCount++;
      whereClause += ` AND q.question_type = $${paramCount}`;
      params.push(type);
    }

    // Add search filter
    if (search) {
      paramCount++;
      whereClause += ` AND q.question_text ILIKE $${paramCount}`;
      params.push(`%${search}%`);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM questions q
      LEFT JOIN survey_categories sc ON q.category_id = sc.id
      ${whereClause}
    `;
    const countResult = await db.queryOne<{ total: string }>(countQuery, params);
    const total = parseInt(countResult?.total || '0', 10);

    // Get questions with pagination
    paramCount++;
    const limitParam = paramCount;
    paramCount++;
    const offsetParam = paramCount;

    const questionsQuery = `
      SELECT 
        q.id,
        q.question_text as question,
        q.question_type as type,
        sc.name as category,
        q.is_required,
        q.options,
        NULL as min_value,
        NULL as max_value,
        NULL as min_label,
        NULL as max_label,
        q.created_at,
        q.updated_at
      FROM questions q
      LEFT JOIN survey_categories sc ON q.category_id = sc.id
      ${whereClause}
      ORDER BY q.created_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    const questions = await db.query<QuestionResponse>(questionsQuery, [
      ...params,
      pageSize,
      offset,
    ]);

    return {
      data: questions,
      total,
      page,
      pageSize,
    };
  }

  /**
   * Get a question by ID
   */
  async getQuestionById(id: number): Promise<QuestionResponse | null> {
    const query = `
      SELECT 
        q.id,
        q.question_text as question,
        q.question_type as type,
        sc.name as category,
        q.is_required,
        q.options,
        NULL as min_value,
        NULL as max_value,
        NULL as min_label,
        NULL as max_label,
        q.created_at,
        q.updated_at
      FROM questions q
      LEFT JOIN survey_categories sc ON q.category_id = sc.id
      WHERE q.id = $1
    `;

    return await db.queryOne<QuestionResponse>(query, [id]);
  }

  /**
   * Create a new question
   */
  async createQuestion(data: CreateQuestionDto): Promise<QuestionResponse> {
    // First get category_id from category code
    let categoryId: number | null = null;
    if (data.category) {
      const categoryQuery = 'SELECT id FROM survey_categories WHERE code = $1';
      const categoryResult = await db.queryOne<{ id: number }>(categoryQuery, [data.category]);
      categoryId = categoryResult?.id || null;
    }

    // Map question type to database enum
    const dbQuestionType = this.mapQuestionTypeToDb(data.type);

    const query = `
      INSERT INTO questions (
        category_id,
        question_text,
        question_type,
        options,
        is_required,
        description
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING 
        id,
        question_text,
        question_type,
        is_required,
        options,
        created_at,
        updated_at
    `;

    const result = await db.queryOne(query, [
      categoryId,
      data.question,
      dbQuestionType,
      data.options ? JSON.stringify(data.options) : null,
      data.is_required,
      null, // description
    ]);

    if (!result) {
      throw new Error('Failed to create question');
    }

    logger.info('Question created', { questionId: result.id });

    // Return in the expected format
    return {
      id: result.id,
      question: result.question_text,
      type: data.type,
      category: data.category,
      is_required: result.is_required,
      options: result.options ? JSON.parse(result.options) : null,
      min_value: data.min_value || null,
      max_value: data.max_value || null,
      min_label: data.min_label || null,
      max_label: data.max_label || null,
      created_at: result.created_at,
      updated_at: result.updated_at,
    };
  }

  /**
   * Update a question
   */
  async updateQuestion(id: number, data: UpdateQuestionDto): Promise<QuestionResponse | null> {
    // Build dynamic update query
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    if (data.question !== undefined) {
      paramCount++;
      fields.push(`question_text = $${paramCount}`);
      values.push(data.question);
    }

    if (data.type !== undefined) {
      paramCount++;
      fields.push(`question_type = $${paramCount}`);
      values.push(this.mapQuestionTypeToDb(data.type));
    }

    if (data.category !== undefined) {
      // Get category_id from category code
      const categoryQuery = 'SELECT id FROM survey_categories WHERE code = $1';
      const categoryResult = await db.queryOne<{ id: number }>(categoryQuery, [data.category]);
      const categoryId = categoryResult?.id || null;

      paramCount++;
      fields.push(`category_id = $${paramCount}`);
      values.push(categoryId);
    }

    if (data.is_required !== undefined) {
      paramCount++;
      fields.push(`is_required = $${paramCount}`);
      values.push(data.is_required);
    }

    if (data.options !== undefined) {
      paramCount++;
      fields.push(`options = $${paramCount}`);
      values.push(data.options ? JSON.stringify(data.options) : null);
    }

    if (fields.length === 0) {
      // No fields to update, return current question
      return await this.getQuestionById(id);
    }

    // Add updated_at
    paramCount++;
    fields.push(`updated_at = $${paramCount}`);
    values.push(new Date().toISOString());

    // Add ID parameter
    paramCount++;
    values.push(id);

    const query = `
      UPDATE questions
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id
    `;

    const result = await db.queryOne(query, values);

    if (result) {
      logger.info('Question updated', { questionId: id });
      return await this.getQuestionById(id);
    }

    return null;
  }

  /**
   * Delete a question
   */
  async deleteQuestion(id: number): Promise<boolean> {
    const query = 'DELETE FROM questions WHERE id = $1';
    const result = await db.query(query, [id]);

    const deleted = result.length > 0;
    if (deleted) {
      logger.info('Question deleted', { questionId: id });
    }

    return deleted;
  }

  /**
   * Check if question exists
   */
  async questionExists(id: number): Promise<boolean> {
    const query = 'SELECT 1 FROM questions WHERE id = $1 LIMIT 1';
    const result = await db.queryOne(query, [id]);
    return !!result;
  }

  /**
   * Map frontend question type to database enum
   */
  private mapQuestionTypeToDb(type: string): string {
    const mapping: Record<string, string> = {
      text: 'text',
      textarea: 'text',
      radio: 'select',
      checkbox: 'select',
      select: 'select',
      rating: 'rating_5',
      scale: 'rating_10',
      boolean: 'yes_no',
    };

    return mapping[type] || type;
  }
}
