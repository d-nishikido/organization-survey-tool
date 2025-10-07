/**
 * Cache Manager Test
 * テスト: キャッシュ管理の基本機能検証
 */

import { CacheManager } from '../../services/cache-manager';
import { ConnectionPool } from '../../database/connection-pool';
import { CacheEntry } from '../../types/cache.types';

describe('CacheManager', () => {
  let cacheManager: CacheManager;
  let pool: ConnectionPool;

  beforeAll(async () => {
    pool = new ConnectionPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'organization_survey',
      user: process.env.DB_USER || 'survey_user',
      password: process.env.DB_PASSWORD || 'survey_password',
    });
    cacheManager = new CacheManager(pool);
  });

  afterAll(async () => {
    await pool.close();
  });

  afterEach(async () => {
    // テスト後のクリーンアップ
    await pool.query('DELETE FROM analytics_cache WHERE survey_id >= 9000');
  });

  describe('set() - キャッシュエントリの挿入・更新', () => {
    test('新規キャッシュエントリを挿入できる', async () => {
      const surveyId = 9001;
      const metricName = 'test_summary';
      const metricData = { total: 100, average: 4.5 };

      const result = await cacheManager.set(
        surveyId,
        metricName,
        metricData
      );

      expect(result).toBeDefined();
      expect(result.survey_id).toBe(surveyId);
      expect(result.metric_name).toBe(metricName);
      expect(result.metric_data).toEqual(metricData);
      expect(result.generated_at).toBeDefined();
      expect(result.expires_at).toBeDefined();
    });

    test('既存のキャッシュエントリを更新できる（UPSERT）', async () => {
      const surveyId = 9002;
      const metricName = 'test_summary';
      const initialData = { total: 50 };
      const updatedData = { total: 100 };

      // 初回挿入
      await cacheManager.set(surveyId, metricName, initialData);

      // 更新（UPSERT）
      const result = await cacheManager.set(surveyId, metricName, updatedData);

      expect(result.metric_data).toEqual(updatedData);
      expect(result.survey_id).toBe(surveyId);

      // データベース内のエントリ数を確認（重複なし）
      const count = await pool.query(
        'SELECT COUNT(*) as count FROM analytics_cache WHERE survey_id = $1 AND metric_name = $2',
        [surveyId, metricName]
      );
      expect(parseInt(count.rows[0].count)).toBe(1);
    });

    test('TTLが24時間後に設定される', async () => {
      const surveyId = 9003;
      const metricName = 'test_ttl';
      const metricData = { test: true };

      const result = await cacheManager.set(surveyId, metricName, metricData);

      const generatedAt = new Date(result.generated_at);
      const expiresAt = new Date(result.expires_at);
      const diffHours = (expiresAt.getTime() - generatedAt.getTime()) / (1000 * 60 * 60);

      expect(diffHours).toBeCloseTo(24, 1);
    });

    test('category_filterを指定してキャッシュを保存できる', async () => {
      const surveyId = 9004;
      const metricName = 'category_analysis';
      const metricData = { average: 4.0 };
      const categoryFilter = 'A';

      const result = await cacheManager.set(
        surveyId,
        metricName,
        metricData,
        categoryFilter
      );

      expect(result.category_filter).toBe(categoryFilter);
    });
  });

  describe('get() - キャッシュエントリの取得', () => {
    test('有効なキャッシュエントリを取得できる', async () => {
      const surveyId = 9005;
      const metricName = 'test_get';
      const metricData = { value: 123 };

      await cacheManager.set(surveyId, metricName, metricData);

      const result = await cacheManager.get(surveyId, metricName);

      expect(result).toBeDefined();
      expect(result?.metric_data).toEqual(metricData);
    });

    test('有効期限切れのキャッシュはnullを返す', async () => {
      const surveyId = 9006;
      const metricName = 'test_expired';
      const metricData = { value: 456 };

      // 手動で有効期限切れのキャッシュを作成
      await pool.query(
        `INSERT INTO analytics_cache
         (survey_id, metric_name, metric_data, generated_at, expires_at)
         VALUES ($1, $2, $3, NOW() - INTERVAL '25 hours', NOW() - INTERVAL '1 hour')`,
        [surveyId, metricName, JSON.stringify(metricData)]
      );

      const result = await cacheManager.get(surveyId, metricName);

      expect(result).toBeNull();
    });

    test('存在しないキャッシュはnullを返す', async () => {
      const result = await cacheManager.get(9999, 'nonexistent');

      expect(result).toBeNull();
    });

    test('category_filterを指定してキャッシュを取得できる', async () => {
      const surveyId = 9007;
      const metricName = 'category_test';
      const metricData = { value: 789 };
      const categoryFilter = 'B';

      await cacheManager.set(surveyId, metricName, metricData, categoryFilter);

      const result = await cacheManager.get(surveyId, metricName, categoryFilter);

      expect(result).toBeDefined();
      expect(result?.category_filter).toBe(categoryFilter);
    });
  });

  describe('invalidate() - キャッシュ無効化', () => {
    test('特定の調査の全キャッシュを無効化できる', async () => {
      const surveyId = 9008;

      // 複数のキャッシュエントリを作成
      await cacheManager.set(surveyId, 'summary', { total: 100 });
      await cacheManager.set(surveyId, 'category_A', { avg: 4.0 }, 'A');
      await cacheManager.set(surveyId, 'category_B', { avg: 3.5 }, 'B');

      // 無効化
      await cacheManager.invalidate(surveyId);

      // すべてのキャッシュが削除されたことを確認
      const summary = await cacheManager.get(surveyId, 'summary');
      const categoryA = await cacheManager.get(surveyId, 'category_A', 'A');
      const categoryB = await cacheManager.get(surveyId, 'category_B', 'B');

      expect(summary).toBeNull();
      expect(categoryA).toBeNull();
      expect(categoryB).toBeNull();
    });

    test('特定のメトリックのみ無効化できる', async () => {
      const surveyId = 9009;

      await cacheManager.set(surveyId, 'summary', { total: 100 });
      await cacheManager.set(surveyId, 'trends', { direction: 'up' });

      // summaryのみ無効化
      await cacheManager.invalidate(surveyId, 'summary');

      const summary = await cacheManager.get(surveyId, 'summary');
      const trends = await cacheManager.get(surveyId, 'trends');

      expect(summary).toBeNull();
      expect(trends).toBeDefined();
    });
  });

  describe('cleanupExpired() - 有効期限切れキャッシュのクリーンアップ', () => {
    test('有効期限切れのキャッシュを削除できる', async () => {
      const surveyId = 9010;

      // 有効期限切れのキャッシュを作成
      await pool.query(
        `INSERT INTO analytics_cache
         (survey_id, metric_name, metric_data, expires_at)
         VALUES ($1, $2, $3, NOW() - INTERVAL '1 hour')`,
        [surveyId, 'expired_metric', JSON.stringify({ test: true })]
      );

      // 有効なキャッシュを作成
      await cacheManager.set(surveyId, 'valid_metric', { test: true });

      const deletedCount = await cacheManager.cleanupExpired();

      expect(deletedCount).toBeGreaterThanOrEqual(1);

      // 有効期限切れのキャッシュが削除されたことを確認
      const expired = await pool.query(
        'SELECT * FROM analytics_cache WHERE survey_id = $1 AND metric_name = $2',
        [surveyId, 'expired_metric']
      );
      expect(expired.rows).toHaveLength(0);

      // 有効なキャッシュは残っていることを確認
      const valid = await cacheManager.get(surveyId, 'valid_metric');
      expect(valid).toBeDefined();
    });
  });
});
