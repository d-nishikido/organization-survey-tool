import { BaseRepository } from './base.repository';
import { ITransaction, QueryCriteria } from './interfaces';
import { SurveyResponse } from '../types/survey.types';

export interface SurveyEntity {
  id: number;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'closed';
  start_date: Date;
  end_date: Date;
  is_anonymous: boolean;
  created_at: Date;
  updated_at: Date;
}

export class SurveyRepository extends BaseRepository<SurveyEntity> {
  constructor(transaction?: ITransaction) {
    super('surveys', transaction);
  }

  async findAllWithResponseCount(criteria?: QueryCriteria): Promise<SurveyResponse[]> {
    let query = `
      SELECT 
        s.id,
        s.title,
        s.description,
        s.status,
        s.start_date,
        s.end_date,
        s.is_anonymous,
        s.created_at,
        s.updated_at,
        COALESCE(r.response_count, 0) as response_count
      FROM surveys s
      LEFT JOIN (
        SELECT 
          survey_id, 
          COUNT(DISTINCT session_token) as response_count
        FROM survey_responses 
        GROUP BY survey_id
      ) r ON s.id = r.survey_id
    `;

    const params: any[] = [];
    let paramCount = 0;

    if (criteria?.where) {
      const whereConditions: string[] = [];
      Object.entries(criteria.where).forEach(([key, value]) => {
        paramCount++;
        if (key === 'status') {
          whereConditions.push(`s.status = $${paramCount}`);
        } else if (key === 'search') {
          whereConditions.push(`(s.title ILIKE $${paramCount} OR s.description ILIKE $${paramCount})`);
          value = `%${value}%`;
        } else {
          whereConditions.push(`s.${key} = $${paramCount}`);
        }
        params.push(value);
      });
      
      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }
    }

    if (criteria?.orderBy && criteria.orderBy.length > 0) {
      const orderClauses = criteria.orderBy.map(
        (order) => `s.${order.field} ${order.direction}`
      );
      query += ` ORDER BY ${orderClauses.join(', ')}`;
    } else {
      query += ` ORDER BY s.created_at DESC`;
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

    return this.query<SurveyResponse>(query, params);
  }

  async findByIdWithResponseCount(id: number): Promise<SurveyResponse | null> {
    const query = `
      SELECT 
        s.id,
        s.title,
        s.description,
        s.status,
        s.start_date,
        s.end_date,
        s.is_anonymous,
        s.created_at,
        s.updated_at,
        COALESCE(r.response_count, 0) as response_count
      FROM surveys s
      LEFT JOIN (
        SELECT 
          survey_id, 
          COUNT(DISTINCT session_token) as response_count
        FROM survey_responses 
        WHERE survey_id = $1
        GROUP BY survey_id
      ) r ON s.id = r.survey_id
      WHERE s.id = $1
    `;

    return this.queryOne<SurveyResponse>(query, [id]);
  }

  async findActiveSurveys(): Promise<SurveyEntity[]> {
    return this.findAll({
      where: { 
        status: 'active'
      },
      orderBy: [{ field: 'start_date', direction: 'ASC' }]
    });
  }

  async findByStatus(status: SurveyEntity['status']): Promise<SurveyEntity[]> {
    return this.findAll({
      where: { status },
      orderBy: [{ field: 'created_at', direction: 'DESC' }]
    });
  }
}