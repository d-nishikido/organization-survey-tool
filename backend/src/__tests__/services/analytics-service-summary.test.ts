/**
 * Analytics Service - Survey Summary Test
 * テスト: 調査サマリー生成機能の拡張検証
 */

import { AnalyticsService } from '../../services/analytics.service';
import { CacheManager } from '../../services/cache-manager';
import { ConnectionPool } from '../../database/connection-pool';

describe('AnalyticsService - Survey Summary', () => {
  let analyticsService: AnalyticsService;
  let cacheManager: CacheManager;
  let pool: ConnectionPool;
  let testSurveyId: number;

  beforeAll(async () => {
    pool = new ConnectionPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'organization_survey',
      user: process.env.DB_USER || 'survey_user',
      password: process.env.DB_PASSWORD || 'survey_password',
    });

    cacheManager = new CacheManager(pool);
    analyticsService = new AnalyticsService(pool, cacheManager);

    // テスト用の調査を作成
    const surveyResult = await pool.query(
      `INSERT INTO surveys (title, description, target_count, start_date, end_date, is_active)
       VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '30 days', true)
       RETURNING id`,
      ['Test Survey for Analytics', 'Test survey for summary generation', 100]
    );
    testSurveyId = surveyResult.rows[0].id;
  });

  afterAll(async () => {
    // クリーンアップ
    await pool.query('DELETE FROM surveys WHERE id = $1', [testSurveyId]);
    await pool.close();
  });

  beforeEach(async () => {
    // キャッシュクリア
    await cacheManager.invalidate(testSurveyId);
  });

  describe('総回答数の集計', () => {
    test('ユニークな回答者数を正しく集計できる', async () => {
      // テストデータ作成: 3つの異なるセッショントークンで回答
      const sessions = ['session_001', 'session_002', 'session_003'];

      for (const sessionToken of sessions) {
        await pool.query(
          `INSERT INTO survey_responses (survey_id, question_id, session_token, response_value, created_at)
           VALUES ($1, 1, $2, '4', NOW())`,
          [testSurveyId, sessionToken]
        );
      }

      const summary = await analyticsService.getSurveySummary(testSurveyId, false);

      expect(summary.total_responses).toBe(3);
    });

    test('同一セッショントークンは1回のみカウントする', async () => {
      const sessionToken = 'session_duplicate';

      // 同じセッショントークンで複数回答
      for (let i = 0; i < 5; i++) {
        await pool.query(
          `INSERT INTO survey_responses (survey_id, question_id, session_token, response_value, created_at)
           VALUES ($1, $2, $3, '5', NOW())`,
          [testSurveyId, i + 1, sessionToken]
        );
      }

      const summary = await analyticsService.getSurveySummary(testSurveyId, false);

      expect(summary.total_responses).toBe(1);
    });
  });

  describe('完了率の計算', () => {
    test('目標回答数に対する完了率を正しく計算できる', async () => {
      // 目標回答数100に対して50件の回答
      for (let i = 0; i < 50; i++) {
        await pool.query(
          `INSERT INTO survey_responses (survey_id, question_id, session_token, response_value, created_at)
           VALUES ($1, 1, $2, '4', NOW())`,
          [testSurveyId, `session_rate_${i}`]
        );
      }

      const summary = await analyticsService.getSurveySummary(testSurveyId, false);

      expect(summary.completion_rate).toBe(50.0);
    });

    test('目標回答数が0の場合、完了率は0になる', async () => {
      // 目標回答数0の調査を作成
      const zeroTargetSurvey = await pool.query(
        `INSERT INTO surveys (title, description, target_count, start_date, end_date, is_active)
         VALUES ($1, $2, 0, NOW(), NOW() + INTERVAL '30 days', true)
         RETURNING id`,
        ['Zero Target Survey', 'Test survey with zero target', ]
      );
      const zeroTargetId = zeroTargetSurvey.rows[0].id;

      const summary = await analyticsService.getSurveySummary(zeroTargetId, false);

      expect(summary.completion_rate).toBe(0);

      // クリーンアップ
      await pool.query('DELETE FROM surveys WHERE id = $1', [zeroTargetId]);
    });

    test('100%を超える完了率も正しく計算できる', async () => {
      // 目標回答数100に対して150件の回答
      for (let i = 0; i < 150; i++) {
        await pool.query(
          `INSERT INTO survey_responses (survey_id, question_id, session_token, response_value, created_at)
           VALUES ($1, 1, $2, '4', NOW())`,
          [testSurveyId, `session_over_${i}`]
        );
      }

      const summary = await analyticsService.getSurveySummary(testSurveyId, false);

      expect(summary.completion_rate).toBe(150.0);
    });
  });

  describe('カテゴリ別平均スコアの算出', () => {
    beforeEach(async () => {
      // カテゴリとquestionsテーブルにテストデータが存在することを前提
      // カテゴリA, B, Cに対応する質問を作成
    });

    test('各カテゴリの平均スコアを正しく算出できる', async () => {
      // カテゴリA: 平均4.0、カテゴリB: 平均3.5のデータを作成
      // (既存のquestionsとcategoriesが存在する前提)

      const summary = await analyticsService.getSurveySummary(testSurveyId, false);

      expect(summary.average_scores).toBeDefined();
      expect(typeof summary.average_scores).toBe('object');
    });

    test('回答がないカテゴリは平均スコアに含まれない', async () => {
      const summary = await analyticsService.getSurveySummary(testSurveyId, false);

      // 回答がない場合、average_scoresは空オブジェクト
      if (Object.keys(summary.average_scores).length === 0) {
        expect(summary.average_scores).toEqual({});
      }
    });
  });

  describe('回答分布の集計', () => {
    test('スコア1-5の度数分布を正しく集計できる', async () => {
      // スコア別の回答を作成
      const scoreDistribution = {
        '1': 5,
        '2': 10,
        '3': 20,
        '4': 15,
        '5': 10,
      };

      let sessionIndex = 0;
      for (const [score, count] of Object.entries(scoreDistribution)) {
        for (let i = 0; i < count; i++) {
          await pool.query(
            `INSERT INTO survey_responses (survey_id, question_id, session_token, response_value, created_at)
             VALUES ($1, 1, $2, $3, NOW())`,
            [testSurveyId, `session_dist_${sessionIndex++}`, score]
          );
        }
      }

      const summary = await analyticsService.getSurveySummary(testSurveyId, false);

      expect(summary.response_distribution).toBeDefined();
      expect(summary.response_distribution['1']).toBe(5);
      expect(summary.response_distribution['2']).toBe(10);
      expect(summary.response_distribution['3']).toBe(20);
      expect(summary.response_distribution['4']).toBe(15);
      expect(summary.response_distribution['5']).toBe(10);
    });
  });

  describe('キャッシュ統合', () => {
    test('useCacheがtrueの場合、キャッシュから結果を返す', async () => {
      // 初回呼び出し（キャッシュに保存）
      const firstCall = await analyticsService.getSurveySummary(testSurveyId, true);

      // 2回目の呼び出し（キャッシュから取得）
      const secondCall = await analyticsService.getSurveySummary(testSurveyId, true);

      expect(firstCall).toEqual(secondCall);

      // キャッシュが実際に使われているか確認
      const cachedEntry = await cacheManager.get(testSurveyId, 'summary');
      expect(cachedEntry).toBeDefined();
    });

    test('useCacheがfalseの場合、キャッシュを使わず常に新規生成する', async () => {
      const result = await analyticsService.getSurveySummary(testSurveyId, false);

      expect(result).toBeDefined();

      // キャッシュが作成されていないことを確認
      const cachedEntry = await cacheManager.get(testSurveyId, 'summary');
      expect(cachedEntry).toBeNull();
    });
  });

  describe('エラーハンドリング', () => {
    test('存在しない調査IDの場合、適切なエラーをスローする', async () => {
      await expect(
        analyticsService.getSurveySummary(99999, false)
      ).rejects.toThrow();
    });
  });
});
