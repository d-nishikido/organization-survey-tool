export interface QueryCriteria {
  where?: Record<string, any>;
  orderBy?: { field: string; direction: 'ASC' | 'DESC' }[];
  limit?: number;
  offset?: number;
}

export interface IRepository<T> {
  findById(id: number): Promise<T | null>;
  findAll(criteria?: QueryCriteria): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: number, data: Partial<T>): Promise<T | null>;
  delete(id: number): Promise<boolean>;
  exists(id: number): Promise<boolean>;
}

export interface ITransaction {
  query<T = any>(text: string, params?: any[]): Promise<T[]>;
  queryOne<T = any>(text: string, params?: any[]): Promise<T | null>;
}