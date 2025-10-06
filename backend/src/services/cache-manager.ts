/**
 * Cache Manager Service
 * 分析結果キャッシュの管理を担当
 */

import { ConnectionPool } from '../database/connection-pool';
import { logger } from '../utils/logger';
import { CacheEntry, CacheStats } from '../types/cache.types';

export class CacheManager {
  private pool: ConnectionPool;
  private defaultTtlHours: number = 24;

  constructor(pool: ConnectionPool, ttlHours?: number) {
    this.pool = pool;
    if (ttlHours !== undefined) {
      this.defaultTtlHours = ttlHours;
    }
  }

  /**
   * キャッシュエントリを設定（UPSERT）
   * @param surveyId 調査ID
   * @param metricName メトリック名
   * @param metricData メトリックデータ（JSON）
   * @param categoryFilter カテゴリフィルタ（オプショナル）
   * @param ttlHours TTL（時間、デフォルト24時間）
   * @returns 作成/更新されたキャッシュエントリ
   */
  async set(
    surveyId: number,
    metricName: string,
    metricData: Record<string, any>,
    categoryFilter: string | null = null,
    ttlHours?: number
  ): Promise<CacheEntry> {
    const ttl = ttlHours ?? this.defaultTtlHours;

    try {
      const rows = await this.pool.query<CacheEntry>(
        `INSERT INTO analytics_cache
         (survey_id, metric_name, metric_data, category_filter, generated_at, expires_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW() + INTERVAL '${ttl} hours')
         ON CONFLICT (survey_id, metric_name, category_filter)
         DO UPDATE SET
           metric_data = EXCLUDED.metric_data,
           generated_at = EXCLUDED.generated_at,
           expires_at = EXCLUDED.expires_at
         RETURNING *`,
        [surveyId, metricName, JSON.stringify(metricData), categoryFilter]
      );

      logger.info('Cache entry set', {
        surveyId,
        metricName,
        categoryFilter,
        ttlHours: ttl,
      });

      return {
        ...rows[0],
        metric_data: rows[0].metric_data as Record<string, any>,
      };
    } catch (error) {
      logger.error('Failed to set cache entry', {
        surveyId,
        metricName,
        categoryFilter,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * キャッシュエントリを取得
   * @param surveyId 調査ID
   * @param metricName メトリック名
   * @param categoryFilter カテゴリフィルタ（オプショナル）
   * @returns キャッシュエントリ（有効期限切れまたは存在しない場合はnull）
   */
  async get(
    surveyId: number,
    metricName: string,
    categoryFilter: string | null = null
  ): Promise<CacheEntry | null> {
    try {
      const rows = await this.pool.query<CacheEntry>(
        `SELECT *
         FROM analytics_cache
         WHERE survey_id = $1
           AND metric_name = $2
           AND (category_filter = $3 OR (category_filter IS NULL AND $3 IS NULL))
           AND (expires_at IS NULL OR expires_at > NOW())`,
        [surveyId, metricName, categoryFilter]
      );

      if (rows.length === 0) {
        logger.debug('Cache miss', { surveyId, metricName, categoryFilter });
        return null;
      }

      logger.debug('Cache hit', { surveyId, metricName, categoryFilter });
      return {
        ...rows[0],
        metric_data: rows[0].metric_data as Record<string, any>,
      };
    } catch (error) {
      logger.error('Failed to get cache entry', {
        surveyId,
        metricName,
        categoryFilter,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * キャッシュを無効化（削除）
   * @param surveyId 調査ID
   * @param metricName メトリック名（省略時は全メトリック）
   * @returns 削除されたレコード数
   */
  async invalidate(surveyId: number, metricName?: string): Promise<number> {
    try {
      let query: string;
      let params: any[];

      if (metricName) {
        query = 'DELETE FROM analytics_cache WHERE survey_id = $1 AND metric_name = $2';
        params = [surveyId, metricName];
      } else {
        query = 'DELETE FROM analytics_cache WHERE survey_id = $1';
        params = [surveyId];
      }

      const result = await this.pool.execute(query, params);

      logger.info('Cache invalidated', {
        surveyId,
        metricName: metricName || 'all',
        deletedCount: result.rowCount || 0,
      });

      return result.rowCount || 0;
    } catch (error) {
      logger.error('Failed to invalidate cache', {
        surveyId,
        metricName,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 有効期限切れキャッシュのクリーンアップ
   * @returns 削除されたレコード数
   */
  async cleanupExpired(): Promise<number> {
    try {
      const result = await this.pool.execute(
        'DELETE FROM analytics_cache WHERE expires_at IS NOT NULL AND expires_at < NOW()'
      );

      const deletedCount = result.rowCount || 0;

      if (deletedCount > 0) {
        logger.info('Expired cache cleaned up', { deletedCount });
      }

      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup expired cache', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * キャッシュ統計を取得
   * @returns キャッシュサイズ、最古エントリ、最新エントリ等の統計情報
   */
  async getStats(): Promise<CacheStats> {
    try {
      const rows = await this.pool.query<{
        total: string;
        expired: string;
        oldest: string;
        newest: string;
      }>(
        `SELECT
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE expires_at < NOW()) as expired,
           MIN(generated_at)::text as oldest,
           MAX(generated_at)::text as newest
         FROM analytics_cache`
      );

      return {
        totalEntries: parseInt(rows[0].total),
        expiredEntries: parseInt(rows[0].expired),
        oldestEntry: rows[0].oldest,
        newestEntry: rows[0].newest,
      };
    } catch (error) {
      logger.error('Failed to get cache stats', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
