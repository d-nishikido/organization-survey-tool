import { BaseRepository } from './base.repository';
import { ITransaction } from './interfaces';

export interface AdminStatsData {
  active_surveys: number;
  total_responses: number;
  response_rate: number;
  avg_completion_time: number;
}

export interface ActivityLogData {
  id: number;
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
}

export class AdminRepository extends BaseRepository<any> {
  constructor(transaction?: ITransaction) {
    super('surveys', transaction);
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<AdminStatsData> {
    const query = `
      WITH survey_stats AS (
        SELECT
          COUNT(*) FILTER (WHERE status = 'active') as active_surveys,
          COUNT(*) as total_surveys
        FROM surveys
      ),
      response_stats AS (
        SELECT
          COUNT(DISTINCT session_token) as total_responses,
          AVG(
            EXTRACT(EPOCH FROM (submitted_at - created_at)) / 60
          )::numeric(10,1) as avg_completion_time
        FROM survey_responses
        WHERE submitted_at IS NOT NULL
      )
      SELECT
        COALESCE(ss.active_surveys, 0)::int as active_surveys,
        COALESCE(rs.total_responses, 0)::int as total_responses,
        CASE
          WHEN ss.total_surveys > 0 AND rs.total_responses > 0
          THEN (rs.total_responses::float / ss.total_surveys * 100)::numeric(10,1)
          ELSE 0
        END as response_rate,
        COALESCE(rs.avg_completion_time, 0) as avg_completion_time
      FROM survey_stats ss
      CROSS JOIN response_stats rs
    `;

    const result = await this.queryOne<AdminStatsData>(query);

    if (!result) {
      return {
        active_surveys: 0,
        total_responses: 0,
        response_rate: 0,
        avg_completion_time: 0
      };
    }

    return result;
  }

  /**
   * Get recent activity logs
   */
  async getRecentActivity(limit: number = 10): Promise<ActivityLogData[]> {
    const query = `
      WITH survey_created AS (
        SELECT
          id,
          'survey_created' as type,
          '新しい調査「' || title || '」が作成されました' as title,
          CASE
            WHEN created_at > NOW() - INTERVAL '1 hour' THEN
              EXTRACT(EPOCH FROM (NOW() - created_at))::int / 60 || '分前'
            WHEN created_at > NOW() - INTERVAL '1 day' THEN
              EXTRACT(EPOCH FROM (NOW() - created_at))::int / 3600 || '時間前'
            ELSE
              EXTRACT(EPOCH FROM (NOW() - created_at))::int / 86400 || '日前'
          END as description,
          created_at as timestamp,
          '📝' as icon
        FROM surveys
        ORDER BY created_at DESC
        LIMIT $1
      ),
      responses_received AS (
        SELECT
          survey_id as id,
          'responses_received' as type,
          COUNT(DISTINCT session_token)::text || '件の新しい回答が収集されました' as title,
          CASE
            WHEN MAX(submitted_at) > NOW() - INTERVAL '1 hour' THEN
              EXTRACT(EPOCH FROM (NOW() - MAX(submitted_at)))::int / 60 || '分前'
            WHEN MAX(submitted_at) > NOW() - INTERVAL '1 day' THEN
              EXTRACT(EPOCH FROM (NOW() - MAX(submitted_at)))::int / 3600 || '時間前'
            ELSE
              EXTRACT(EPOCH FROM (NOW() - MAX(submitted_at)))::int / 86400 || '日前'
          END as description,
          MAX(submitted_at) as timestamp,
          '✅' as icon
        FROM survey_responses
        WHERE submitted_at IS NOT NULL
        GROUP BY survey_id
        ORDER BY MAX(submitted_at) DESC
        LIMIT $1
      )
      SELECT * FROM (
        SELECT * FROM survey_created
        UNION ALL
        SELECT * FROM responses_received
      ) combined
      ORDER BY timestamp DESC
      LIMIT $1
    `;

    const results = await this.query<ActivityLogData>(query, [limit]);
    return results;
  }
}
