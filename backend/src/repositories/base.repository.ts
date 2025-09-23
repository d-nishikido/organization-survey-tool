import { db } from '../config/database';
import { logger } from '../utils/logger';
import { IRepository, QueryCriteria, ITransaction } from './interfaces';

export abstract class BaseRepository<T> implements IRepository<T> {
  protected tableName: string;
  protected transaction?: ITransaction;

  constructor(tableName: string, transaction?: ITransaction) {
    this.tableName = tableName;
    this.transaction = transaction;
  }

  protected async query<R = any>(text: string, params?: any[]): Promise<R[]> {
    if (this.transaction) {
      return this.transaction.query<R>(text, params);
    }
    return db.query<R>(text, params);
  }

  protected async queryOne<R = any>(text: string, params?: any[]): Promise<R | null> {
    if (this.transaction) {
      return this.transaction.queryOne<R>(text, params);
    }
    return db.queryOne<R>(text, params);
  }

  async findById(id: number): Promise<T | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.queryOne<T>(query, [id]);
    return result;
  }

  async findAll(criteria?: QueryCriteria): Promise<T[]> {
    let query = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];
    let paramCount = 0;

    if (criteria?.where) {
      const whereConditions: string[] = [];
      Object.entries(criteria.where).forEach(([key, value]) => {
        paramCount++;
        if (value === null) {
          whereConditions.push(`${key} IS NULL`);
        } else if (Array.isArray(value)) {
          whereConditions.push(`${key} = ANY($${paramCount})`);
          params.push(value);
        } else {
          whereConditions.push(`${key} = $${paramCount}`);
          params.push(value);
        }
      });
      
      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }
    }

    if (criteria?.orderBy && criteria.orderBy.length > 0) {
      const orderClauses = criteria.orderBy.map(
        (order) => `${order.field} ${order.direction}`
      );
      query += ` ORDER BY ${orderClauses.join(', ')}`;
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

    return this.query<T>(query, params);
  }

  async create(data: Partial<T>): Promise<T> {
    const fields = Object.keys(data).filter(key => data[key as keyof T] !== undefined);
    const values = fields.map(key => data[key as keyof T]);
    
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
    const fieldNames = fields.join(', ');
    
    const query = `
      INSERT INTO ${this.tableName} (${fieldNames})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await this.queryOne<T>(query, values);
    if (!result) {
      throw new Error(`Failed to create record in ${this.tableName}`);
    }

    logger.debug(`Created record in ${this.tableName}`, { id: (result as any).id });
    return result;
  }

  async update(id: number, data: Partial<T>): Promise<T | null> {
    const fields = Object.keys(data).filter(key => data[key as keyof T] !== undefined);
    
    if (fields.length === 0) {
      return this.findById(id);
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = fields.map(key => data[key as keyof T]);
    
    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.queryOne<T>(query, [id, ...values]);
    
    if (result) {
      logger.debug(`Updated record in ${this.tableName}`, { id });
    }
    
    return result;
  }

  async delete(id: number): Promise<boolean> {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
    const result = await this.query(query, [id]);
    
    const deleted = Array.isArray(result) && result.length > 0;
    if (deleted) {
      logger.debug(`Deleted record from ${this.tableName}`, { id });
    }
    
    return deleted;
  }

  async exists(id: number): Promise<boolean> {
    const query = `SELECT 1 FROM ${this.tableName} WHERE id = $1 LIMIT 1`;
    const result = await this.queryOne(query, [id]);
    return !!result;
  }

  async count(criteria?: Pick<QueryCriteria, 'where'>): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params: any[] = [];
    let paramCount = 0;

    if (criteria?.where) {
      const whereConditions: string[] = [];
      Object.entries(criteria.where).forEach(([key, value]) => {
        paramCount++;
        if (value === null) {
          whereConditions.push(`${key} IS NULL`);
        } else {
          whereConditions.push(`${key} = $${paramCount}`);
          params.push(value);
        }
      });
      
      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }
    }

    const result = await this.queryOne<{ count: string }>(query, params);
    return parseInt(result?.count || '0', 10);
  }
}