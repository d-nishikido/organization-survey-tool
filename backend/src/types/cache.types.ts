/**
 * Cache Types
 * キャッシュ関連の型定義
 */

/**
 * キャッシュエントリ
 */
export interface CacheEntry {
  id: number;
  survey_id: number;
  metric_name: string;
  metric_data: Record<string, any>;
  category_filter: string | null;
  generated_at: string;
  expires_at: string;
}

/**
 * キャッシュ統計情報
 */
export interface CacheStats {
  totalEntries: number;
  expiredEntries: number;
  oldestEntry: string | null;
  newestEntry: string | null;
}

/**
 * メトリック名の型定義
 */
export type MetricName =
  | 'summary'
  | 'category_analysis_all'
  | `category_analysis_${string}`
  | `trends_${string}_all`
  | `trends_${string}_${string}`;

/**
 * カテゴリコード
 */
export type CategoryCode = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
