import { db } from '../config/database';
import { logger } from '../utils/logger';
import {
  CreateSurveyDto,
  UpdateSurveyDto,
  SurveyResponse,
  SurveyList,
  SurveyQuery,
} from '../types/survey.types';

export class SurveyService {
  /**
   * Get all surveys with pagination and filtering
   */
  async getAllSurveys(query: SurveyQuery): Promise<SurveyList> {
    const { page = 1, pageSize = 10, status, search } = query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    // Add status filter
    if (status) {
      paramCount++;
      whereClause += ` AND status = $${paramCount}`;
      params.push(status);
    }

    // Add search filter
    if (search) {
      paramCount++;
      whereClause += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM surveys
      ${whereClause}
    `;
    const countResult = await db.queryOne<{ total: string }>(countQuery, params);
    const total = parseInt(countResult?.total || '0', 10);

    // Get surveys with pagination
    paramCount++;
    const limitParam = paramCount;
    paramCount++;
    const offsetParam = paramCount;

    const surveysQuery = `
      SELECT 
        id,
        title,
        description,
        status,
        start_date,
        end_date,
        is_anonymous,
        created_at,
        updated_at,
        (
          SELECT COUNT(DISTINCT session_token)
          FROM survey_responses sr
          WHERE sr.survey_id = surveys.id
        ) as response_count
      FROM surveys
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    const surveys = await db.query<SurveyResponse>(surveysQuery, [...params, pageSize, offset]);

    return {
      data: surveys,
      total,
      page,
      pageSize,
    };
  }

  /**
   * Get a survey by ID
   */
  async getSurveyById(id: number): Promise<SurveyResponse | null> {
    const query = `
      SELECT 
        id,
        title,
        description,
        status,
        start_date,
        end_date,
        is_anonymous,
        created_at,
        updated_at,
        (
          SELECT COUNT(DISTINCT session_token)
          FROM survey_responses sr
          WHERE sr.survey_id = surveys.id
        ) as response_count
      FROM surveys
      WHERE id = $1
    `;

    return await db.queryOne<SurveyResponse>(query, [id]);
  }

  /**
   * Get all questions for a specific survey
   */
  /**
   * Get all questions for a specific survey
   */
  async getSurveyQuestions(surveyId: number): Promise<any[]> {
    const query = `
      SELECT 
        q.id,
        q.question_text as text,
        q.question_type as type,
        q.category_id,
        q.is_required,
        q.options,
        q.description,
        sq.question_order as display_order
      FROM questions q
      INNER JOIN survey_questions sq ON q.id = sq.question_id
      WHERE sq.survey_id = $1 AND sq.is_active = true
      ORDER BY sq.question_order ASC
    `;

    return await db.query(query, [surveyId]);
  }

  /**
   * Create a new survey
   */
  async createSurvey(data: CreateSurveyDto): Promise<SurveyResponse> {
    const query = `
      INSERT INTO surveys (
        title,
        description,
        status,
        start_date,
        end_date,
        is_anonymous
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING 
        id,
        title,
        description,
        status,
        start_date,
        end_date,
        is_anonymous,
        created_at,
        updated_at
    `;

    const result = await db.queryOne<SurveyResponse>(query, [
      data.title,
      data.description || null,
      data.status,
      data.start_date,
      data.end_date,
      data.is_anonymous,
    ]);

    if (!result) {
      throw new Error('Failed to create survey');
    }

    logger.info('Survey created', { surveyId: result.id, title: data.title });
    return { ...result, response_count: 0 };
  }

  /**
   * Update a survey
   */
  async updateSurvey(id: number, data: UpdateSurveyDto): Promise<SurveyResponse | null> {
    // Build dynamic update query
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    if (data.title !== undefined) {
      paramCount++;
      fields.push(`title = $${paramCount}`);
      values.push(data.title);
    }

    if (data.description !== undefined) {
      paramCount++;
      fields.push(`description = $${paramCount}`);
      values.push(data.description);
    }

    if (data.status !== undefined) {
      paramCount++;
      fields.push(`status = $${paramCount}`);
      values.push(data.status);
    }

    if (data.start_date !== undefined) {
      paramCount++;
      fields.push(`start_date = $${paramCount}`);
      values.push(data.start_date);
    }

    if (data.end_date !== undefined) {
      paramCount++;
      fields.push(`end_date = $${paramCount}`);
      values.push(data.end_date);
    }

    if (data.is_anonymous !== undefined) {
      paramCount++;
      fields.push(`is_anonymous = $${paramCount}`);
      values.push(data.is_anonymous);
    }

    if (fields.length === 0) {
      // No fields to update, return current survey
      return await this.getSurveyById(id);
    }

    // Add updated_at
    paramCount++;
    fields.push(`updated_at = $${paramCount}`);
    values.push(new Date().toISOString());

    // Add ID parameter
    paramCount++;
    values.push(id);

    const query = `
      UPDATE surveys
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING 
        id,
        title,
        description,
        status,
        start_date,
        end_date,
        is_anonymous,
        created_at,
        updated_at
    `;

    const result = await db.queryOne<SurveyResponse>(query, values);

    if (result) {
      logger.info('Survey updated', { surveyId: id });
      // Get response count
      const survey = await this.getSurveyById(id);
      return survey;
    }

    return null;
  }

  /**
   * Delete a survey
   */
  async deleteSurvey(id: number): Promise<boolean> {
    const query = 'DELETE FROM surveys WHERE id = $1';
    const result = await db.query(query, [id]);

    const deleted = result.length > 0;
    if (deleted) {
      logger.info('Survey deleted', { surveyId: id });
    }

    return deleted;
  }

  /**
   * Check if survey exists
   */
  async surveyExists(id: number): Promise<boolean> {
    const query = 'SELECT 1 FROM surveys WHERE id = $1 LIMIT 1';
    const result = await db.queryOne(query, [id]);
    return !!result;
  }

  /**
   * Assign question to survey
   */
  async assignQuestionToSurvey(surveyId: number, questionId: number, orderIndex?: number): Promise<void> {
    // Get the next order index if not provided
    let finalOrderIndex = orderIndex;
    if (finalOrderIndex === undefined) {
      const maxOrderQuery = 'SELECT COALESCE(MAX(order_index), 0) as max_order FROM survey_questions WHERE survey_id = $1';
      const result = await db.queryOne<{ max_order: number }>(maxOrderQuery, [surveyId]);
      finalOrderIndex = (result?.max_order || 0) + 1;
    }

    const query = `
      INSERT INTO survey_questions (survey_id, question_id, order_index)
      VALUES ($1, $2, $3)
      ON CONFLICT (survey_id, question_id) 
      DO UPDATE SET order_index = $3
    `;

    await db.query(query, [surveyId, questionId, finalOrderIndex]);
    logger.info('Question assigned to survey', { surveyId, questionId, orderIndex: finalOrderIndex });
  }

  /**
   * Update question order in survey
   */
  async updateQuestionOrder(surveyId: number, questions: { question_id: number; order_index: number }[]): Promise<void> {
    await db.transaction(async (query) => {
      for (const q of questions) {
        const updateQuery = `
          UPDATE survey_questions
          SET order_index = $1
          WHERE survey_id = $2 AND question_id = $3
        `;
        await query(updateQuery, [q.order_index, surveyId, q.question_id]);
      }
    });

    logger.info('Question order updated', { surveyId, questionsCount: questions.length });
  }

  /**
   * Remove question from survey
   */
  async removeQuestionFromSurvey(surveyId: number, questionId: number): Promise<void> {
    const query = 'DELETE FROM survey_questions WHERE survey_id = $1 AND question_id = $2';
    await db.query(query, [surveyId, questionId]);
    logger.info('Question removed from survey', { surveyId, questionId });
  }
}
