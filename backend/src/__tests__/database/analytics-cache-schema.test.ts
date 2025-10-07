/**
 * Analytics Cache Schema Test
 * テスト: analytics_cacheテーブルのスキーマ検証
 */

import { ConnectionPool } from '../../database/connection-pool';

describe('Analytics Cache Schema', () => {
  let pool: ConnectionPool;

  beforeAll(async () => {
    pool = new ConnectionPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'organization_survey',
      user: process.env.DB_USER || 'survey_user',
      password: process.env.DB_PASSWORD || 'survey_password',
    });
  });

  afterAll(async () => {
    await pool.close();
  });

  describe('テーブル存在確認', () => {
    test('analytics_cacheテーブルが存在する', async () => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'analytics_cache'
        ) as exists;
      `);

      expect(result.rows[0].exists).toBe(true);
    });
  });

  describe('カラム構成検証', () => {
    test('必須カラムがすべて存在する', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'analytics_cache'
        ORDER BY ordinal_position;
      `);

      const columns = result.rows.map((row) => ({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES',
      }));

      // 必須カラムの検証
      expect(columns).toContainEqual(
        expect.objectContaining({ name: 'id', type: 'integer', nullable: false })
      );
      expect(columns).toContainEqual(
        expect.objectContaining({ name: 'survey_id', type: 'integer', nullable: false })
      );
      expect(columns).toContainEqual(
        expect.objectContaining({ name: 'metric_name', type: 'character varying', nullable: false })
      );
      expect(columns).toContainEqual(
        expect.objectContaining({ name: 'metric_data', type: 'jsonb', nullable: false })
      );
      expect(columns).toContainEqual(
        expect.objectContaining({ name: 'category_filter', type: 'character varying', nullable: true })
      );
      expect(columns).toContainEqual(
        expect.objectContaining({ name: 'generated_at', type: 'timestamp with time zone', nullable: true })
      );
      expect(columns).toContainEqual(
        expect.objectContaining({ name: 'expires_at', type: 'timestamp with time zone', nullable: true })
      );
    });
  });

  describe('主キー検証', () => {
    test('idカラムがPRIMARY KEYである', async () => {
      const result = await pool.query(`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = 'analytics_cache' AND constraint_type = 'PRIMARY KEY';
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].constraint_type).toBe('PRIMARY KEY');
    });
  });

  describe('インデックス検証', () => {
    test('survey_idにインデックスが存在する', async () => {
      const result = await pool.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'analytics_cache' AND indexname = 'idx_analytics_cache_survey';
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].indexname).toBe('idx_analytics_cache_survey');
    });

    test('expires_atにインデックスが存在する', async () => {
      const result = await pool.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'analytics_cache' AND indexname = 'idx_analytics_cache_expires';
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].indexname).toBe('idx_analytics_cache_expires');
    });
  });

  describe('UNIQUE制約検証', () => {
    test('(survey_id, metric_name, category_filter)にUNIQUE制約が存在する', async () => {
      const result = await pool.query(`
        SELECT conname, contype
        FROM pg_constraint
        WHERE conrelid = 'analytics_cache'::regclass AND contype = 'u';
      `);

      expect(result.rows.length).toBeGreaterThan(0);
    });
  });

  describe('外部キー制約検証', () => {
    test('survey_idがsurveysテーブルへの外部キーである', async () => {
      const result = await pool.query(`
        SELECT
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          rc.delete_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
        WHERE tc.table_name = 'analytics_cache'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'survey_id';
      `);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].foreign_table_name).toBe('surveys');
      expect(result.rows[0].delete_rule).toBe('CASCADE');
    });
  });
});
