import { ConnectionPool } from '../database/connection-pool';
import { StatisticsUtil, BasicStatistics, TrendAnalysis } from '../utils/statistics';
import { logger } from '../utils/logger';
import { CacheManager } from './cache-manager';

export interface SurveySummary {
  survey_id: number;
  survey_title: string;
  total_responses: number;
  completion_rate: number;
  average_scores: Record<string, number>;
  response_distribution: Record<string, number>;
  generated_at: string;
}

export interface CategoryAnalysis {
  category_code: string;
  category_name: string;
  response_count: number;
  average_score: number;
  statistics: BasicStatistics;
  distribution: Array<{ range: string; count: number; percentage: number }>;
}

export interface TrendData {
  period: string;
  data_points: Array<{ date: string; value: number; count: number }>;
  trend: 'increasing' | 'decreasing' | 'stable';
  change_percentage: number;
}

export class AnalyticsService {
  private cacheManager: CacheManager;

  constructor(
    private connectionPool: ConnectionPool,
    cacheManager?: CacheManager
  ) {
    this.cacheManager = cacheManager || new CacheManager(connectionPool);
  }

  /**
   * Get analytics summary for a survey
   */
  async getSurveySummary(surveyId: number, useCache: boolean = true): Promise<SurveySummary> {
    try {
      // Check cache first
      if (useCache) {
        const cachedEntry = await this.cacheManager.get(surveyId, 'summary');
        if (cachedEntry) {
          logger.debug('Returning cached survey summary', { surveyId });
          return cachedEntry.metric_data as SurveySummary;
        }
      }

      // Generate fresh summary
      const summary = await this.generateSurveySummary(surveyId);

      // Cache the result
      if (useCache) {
        await this.cacheManager.set(surveyId, 'summary', summary);
      }

      return summary;
    } catch (error) {
      logger.error('Failed to get survey summary', { surveyId, error });
      throw error;
    }
  }

  /**
   * Get category-based analysis for a survey
   */
  async getCategoryAnalysis(
    surveyId: number,
    categoryCode?: string,
    useCache: boolean = true
  ): Promise<CategoryAnalysis[]> {
    try {
      const cacheKey = `category_analysis_${categoryCode || 'all'}`;

      // Check cache first
      if (useCache) {
        const cachedEntry = await this.cacheManager.get(surveyId, cacheKey, categoryCode || null);
        if (cachedEntry) {
          logger.debug('Returning cached category analysis', { surveyId, categoryCode });
          return cachedEntry.metric_data as CategoryAnalysis[];
        }
      }

      // Generate fresh analysis
      const analysis = await this.generateCategoryAnalysis(surveyId, categoryCode);

      // Cache the result
      if (useCache) {
        await this.cacheManager.set(surveyId, cacheKey, analysis, categoryCode || null);
      }

      return analysis;
    } catch (error) {
      logger.error('Failed to get category analysis', { surveyId, categoryCode, error });
      throw error;
    }
  }

  /**
   * Get trend analysis for surveys
   */
  async getTrendAnalysis(
    surveyId?: number,
    categoryCode?: string,
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' = 'monthly',
    useCache: boolean = true
  ): Promise<TrendData> {
    try {
      const effectiveSurveyId = surveyId || 0;
      const cacheKey = `trends_${period}_${categoryCode || 'all'}`;

      // Check cache first
      if (useCache && effectiveSurveyId > 0) {
        const cachedEntry = await this.cacheManager.get(effectiveSurveyId, cacheKey, categoryCode || null);
        if (cachedEntry) {
          logger.debug('Returning cached trend analysis', { surveyId, categoryCode, period });
          return cachedEntry.metric_data as TrendData;
        }
      }

      // Generate fresh trend analysis
      const trends = await this.generateTrendAnalysis(surveyId, categoryCode, period);

      // Cache the result
      if (useCache && effectiveSurveyId > 0) {
        await this.cacheManager.set(effectiveSurveyId, cacheKey, trends, categoryCode || null);
      }

      return trends;
    } catch (error) {
      logger.error('Failed to get trend analysis', { surveyId, categoryCode, period, error });
      throw error;
    }
  }

  /**
   * Invalidate cache for a survey
   */
  async invalidateCache(surveyId: number, metricName?: string): Promise<void> {
    try {
      await this.cacheManager.invalidate(surveyId, metricName);
      logger.info('Cache invalidated via AnalyticsService', { surveyId, metricName });
    } catch (error) {
      logger.error('Failed to invalidate cache', { surveyId, metricName, error });
      throw error;
    }
  }

  /**
   * Generate survey summary from raw data
   */
  private async generateSurveySummary(surveyId: number): Promise<SurveySummary> {
    const connection = await this.connectionPool.connect();

    try {
      // Get survey info
      const surveyQuery = `
        SELECT title, target_count, start_date, end_date
        FROM surveys
        WHERE id = $1
      `;
      const surveyResult = await connection.query(surveyQuery, [surveyId]);
      const survey = surveyResult.rows[0];

      if (!survey) {
        throw new Error(`Survey ${surveyId} not found`);
      }

      // Get total unique responses
      const responseQuery = `
        SELECT COUNT(DISTINCT session_token) as total_responses
        FROM survey_responses
        WHERE survey_id = $1
      `;
      const responseResult = await connection.query(responseQuery, [surveyId]);
      const totalResponses = parseInt(responseResult.rows[0]?.total_responses || '0');

      // Calculate completion rate
      const completionRate = survey.target_count > 0
        ? (totalResponses / survey.target_count) * 100
        : 0;

      // Get average scores by category
      const avgScoresQuery = `
        SELECT
          sc.code as category_code,
          sc.name as category_name,
          AVG(sr.response_value::numeric) as avg_score
        FROM survey_responses sr
        JOIN questions q ON sr.question_id = q.id
        JOIN survey_categories sc ON q.category_id = sc.id
        WHERE sr.survey_id = $1 AND sr.response_value IS NOT NULL
        GROUP BY sc.code, sc.name
        ORDER BY sc.code
      `;
      const avgScoresResult = await connection.query(avgScoresQuery, [surveyId]);

      const averageScores: Record<string, number> = {};
      avgScoresResult.rows.forEach((row: any) => {
        averageScores[row.category_code] = Number(parseFloat(row.avg_score).toFixed(2));
      });

      // Get response distribution
      const distributionQuery = `
        SELECT
          response_value,
          COUNT(*) as count
        FROM survey_responses
        WHERE survey_id = $1 AND response_value IS NOT NULL
        GROUP BY response_value
        ORDER BY response_value
      `;
      const distributionResult = await connection.query(distributionQuery, [surveyId]);

      const responseDistribution: Record<string, number> = {};
      distributionResult.rows.forEach((row: any) => {
        responseDistribution[row.response_value.toString()] = parseInt(row.count);
      });

      return {
        survey_id: surveyId,
        survey_title: survey.title,
        total_responses: totalResponses,
        completion_rate: Number(completionRate.toFixed(2)),
        average_scores: averageScores,
        response_distribution: responseDistribution,
        generated_at: new Date().toISOString(),
      };

    } finally {
      connection.release();
    }
  }

  /**
   * Generate category-based analysis
   */
  private async generateCategoryAnalysis(
    surveyId: number,
    categoryCode?: string
  ): Promise<CategoryAnalysis[]> {
    const connection = await this.connectionPool.connect();

    try {
      let categoryFilter = '';
      const params: any[] = [surveyId];

      if (categoryCode) {
        categoryFilter = 'AND sc.code = $2';
        params.push(categoryCode);
      }

      const query = `
        SELECT
          sc.code as category_code,
          sc.name as category_name,
          COUNT(sr.response_value) as response_count,
          AVG(sr.response_value::numeric) as avg_score,
          ARRAY_AGG(sr.response_value ORDER BY sr.response_value) as all_values
        FROM survey_categories sc
        LEFT JOIN questions q ON sc.id = q.category_id
        LEFT JOIN survey_responses sr ON q.id = sr.question_id AND sr.survey_id = $1
        WHERE sc.is_active = true ${categoryFilter}
        GROUP BY sc.code, sc.name
        ORDER BY sc.code
      `;

      const result = await connection.query(query, params);
      const analysisResults: CategoryAnalysis[] = [];

      for (const row of result.rows) {
        if (row.response_count > 0) {
          // Filter out null values from the array
          const values: number[] = (row.all_values || []).filter((v: any) => v !== null);

          if (values.length > 0) {
            const statistics = StatisticsUtil.calculateBasicStatistics(values);
            const distribution = StatisticsUtil.calculateDistribution(values, 5);

            analysisResults.push({
              category_code: row.category_code,
              category_name: row.category_name,
              response_count: parseInt(row.response_count),
              average_score: Number(parseFloat(row.avg_score || '0').toFixed(2)),
              statistics,
              distribution,
            });
          }
        }
      }

      return analysisResults;

    } finally {
      connection.release();
    }
  }

  /**
   * Generate trend analysis
   */
  private async generateTrendAnalysis(
    surveyId?: number,
    categoryCode?: string,
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' = 'monthly'
  ): Promise<TrendData> {
    const connection = await this.connectionPool.connect();

    try {
      // Define date truncation based on period
      const dateTrunc = period === 'daily' ? 'day' :
                       period === 'weekly' ? 'week' :
                       period === 'monthly' ? 'month' : 'quarter';

      let surveyFilter = '';
      let categoryFilter = '';
      const params: any[] = [];
      let paramIndex = 1;

      if (surveyId) {
        surveyFilter = `WHERE sr.survey_id = $${paramIndex}`;
        params.push(surveyId);
        paramIndex++;
      }

      if (categoryCode) {
        const whereOrAnd = surveyFilter ? 'AND' : 'WHERE';
        categoryFilter = `${whereOrAnd} sc.code = $${paramIndex}`;
        params.push(categoryCode);
      }

      const query = `
        SELECT
          DATE_TRUNC('${dateTrunc}', sr.created_at) as period_date,
          AVG(sr.response_value::numeric) as avg_value,
          COUNT(sr.response_value) as response_count
        FROM survey_responses sr
        LEFT JOIN questions q ON sr.question_id = q.id
        LEFT JOIN survey_categories sc ON q.category_id = sc.id
        ${surveyFilter} ${categoryFilter}
        AND sr.response_value IS NOT NULL
        AND sr.created_at >= CURRENT_DATE - INTERVAL '1 year'
        GROUP BY DATE_TRUNC('${dateTrunc}', sr.created_at)
        ORDER BY period_date
      `;

      const result = await connection.query(query, params);

      const dataPoints = result.rows.map((row: any) => ({
        date: row.period_date.toISOString().split('T')[0],
        value: Number(parseFloat(row.avg_value).toFixed(2)),
        count: parseInt(row.response_count),
      }));

      // Analyze trend if we have data
      let trendAnalysis: TrendAnalysis = {
        trend: 'stable',
        changePercentage: 0,
        slope: 0,
        correlation: 0,
      };

      if (dataPoints.length >= 2) {
        trendAnalysis = StatisticsUtil.analyzeTrend(dataPoints);
      }

      return {
        period,
        data_points: dataPoints,
        trend: trendAnalysis.trend,
        change_percentage: trendAnalysis.changePercentage,
      };

    } finally {
      connection.release();
    }
  }

}