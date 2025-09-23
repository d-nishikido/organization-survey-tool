import { BaseRepository } from './base.repository';
import { ITransaction, QueryCriteria } from './interfaces';
import { QuestionResponse } from '../types/question.types';

export interface QuestionEntity {
  id: number;
  category_id?: number;
  question_text: string;
  question_type: 'text' | 'select' | 'rating_5' | 'rating_10' | 'yes_no';
  options?: string;
  is_required: boolean;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export class QuestionRepository extends BaseRepository<QuestionEntity> {
  constructor(transaction?: ITransaction) {
    super('questions', transaction);
  }

  async findAllWithCategory(criteria?: QueryCriteria): Promise<QuestionResponse[]> {
    let query = `
      SELECT 
        q.id,
        q.question_text as question,
        q.question_type as type,
        sc.code as category,
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
    `;

    const params: any[] = [];
    let paramCount = 0;

    if (criteria?.where) {
      const whereConditions: string[] = [];
      Object.entries(criteria.where).forEach(([key, value]) => {
        paramCount++;
        if (key === 'category') {
          whereConditions.push(`sc.code = $${paramCount}`);
        } else if (key === 'type') {
          whereConditions.push(`q.question_type = $${paramCount}`);
        } else if (key === 'search') {
          whereConditions.push(`q.question_text ILIKE $${paramCount}`);
          value = `%${value}%`;
        } else {
          whereConditions.push(`q.${key} = $${paramCount}`);
        }
        params.push(value);
      });
      
      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }
    }

    if (criteria?.orderBy && criteria.orderBy.length > 0) {
      const orderClauses = criteria.orderBy.map(
        (order) => `q.${order.field} ${order.direction}`
      );
      query += ` ORDER BY ${orderClauses.join(', ')}`;
    } else {
      query += ` ORDER BY q.created_at DESC`;
    }

    if (criteria?.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(criteria.limit);
    }

    if (criteria?.offset) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(criteria.offset);
    }

    return this.query<QuestionResponse>(query, params);
  }

  async findByIdWithCategory(id: number): Promise<QuestionResponse | null> {
    const query = `
      SELECT 
        q.id,
        q.question_text as question,
        q.question_type as type,
        sc.code as category,
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

    return this.queryOne<QuestionResponse>(query, [id]);
  }

  async findByCategory(categoryCode: string): Promise<QuestionEntity[]> {
    const query = `
      SELECT q.*
      FROM questions q
      LEFT JOIN survey_categories sc ON q.category_id = sc.id
      WHERE sc.code = $1
      ORDER BY q.created_at ASC
    `;

    return this.query<QuestionEntity>(query, [categoryCode]);
  }

  async findByType(questionType: QuestionEntity['question_type']): Promise<QuestionEntity[]> {
    return this.findAll({
      where: { question_type: questionType },
      orderBy: [{ field: 'created_at', direction: 'ASC' }]
    });
  }

  async createWithCategory(
    data: Omit<QuestionEntity, 'id' | 'created_at' | 'updated_at' | 'category_id'> & { category?: string }
  ): Promise<QuestionResponse> {
    let categoryId: number | undefined = undefined;
    
    if (data.category) {
      const categoryQuery = 'SELECT id FROM survey_categories WHERE code = $1';
      const categoryResult = await this.queryOne<{ id: number }>(categoryQuery, [data.category]);
      categoryId = categoryResult?.id || undefined;
    }

    const createData: Partial<QuestionEntity> = {
      category_id: categoryId,
      question_text: data.question_text,
      question_type: data.question_type,
      options: data.options,
      is_required: data.is_required,
      description: data.description,
    };

    const result = await this.create(createData);

    // Return in the expected format
    return {
      id: result.id,
      question: result.question_text,
      type: this.mapDbTypeToFrontend(result.question_type) as any,
      category: (data.category || null) as any,
      is_required: result.is_required,
      options: result.options ? JSON.parse(result.options) : null,
      min_value: null,
      max_value: null,
      min_label: null,
      max_label: null,
      created_at: result.created_at.toISOString(),
      updated_at: result.updated_at.toISOString(),
    };
  }

  private mapDbTypeToFrontend(dbType: string): string {
    const mapping: Record<string, string> = {
      text: 'text',
      select: 'select',
      rating_5: 'rating',
      rating_10: 'scale',
      yes_no: 'boolean',
    };

    return mapping[dbType] || dbType;
  }
}