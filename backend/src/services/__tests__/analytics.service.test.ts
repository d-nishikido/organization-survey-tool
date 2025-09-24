import { AnalyticsService } from '../analytics.service';

// Mock the ConnectionPool
const mockConnectionPool = {
  connect: jest.fn(),
} as any;

// Mock database client
const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    analyticsService = new AnalyticsService(mockConnectionPool);
    mockConnectionPool.connect.mockResolvedValue(mockClient as any);
  });

  describe('getSurveySummary', () => {
    it('should generate survey summary with correct data', async () => {
      // Mock survey data
      const mockSurvey = {
        rows: [{
          title: 'Employee Engagement Survey',
          target_count: 100,
          start_date: '2024-01-01',
          end_date: '2024-12-31'
        }]
      };

      // Mock response count
      const mockResponseCount = { rows: [{ total_responses: '75' }] };

      // Mock average scores
      const mockAvgScores = {
        rows: [
          { category_code: 'engagement', category_name: 'Engagement', avg_score: '4.2' },
          { category_code: 'satisfaction', category_name: 'Satisfaction', avg_score: '3.8' },
        ]
      };

      // Mock response distribution
      const mockDistribution = {
        rows: [
          { response_value: 1, count: '5' },
          { response_value: 2, count: '10' },
          { response_value: 3, count: '15' },
          { response_value: 4, count: '25' },
          { response_value: 5, count: '20' },
        ]
      };

      mockClient.query
        .mockResolvedValueOnce(mockSurvey)      // Survey info query
        .mockResolvedValueOnce(mockResponseCount) // Response count query
        .mockResolvedValueOnce(mockAvgScores)   // Average scores query
        .mockResolvedValueOnce(mockDistribution); // Distribution query

      const result = await analyticsService.getSurveySummary(1, false);

      expect(result).toEqual({
        survey_id: 1,
        survey_title: 'Employee Engagement Survey',
        total_responses: 75,
        completion_rate: 75.0,
        average_scores: {
          engagement: 4.2,
          satisfaction: 3.8,
        },
        response_distribution: {
          '1': 5,
          '2': 10,
          '3': 15,
          '4': 25,
          '5': 20,
        },
        generated_at: expect.any(String),
      });

      expect(mockClient.query).toHaveBeenCalledTimes(4);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw error for non-existent survey', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await expect(analyticsService.getSurveySummary(999, false))
        .rejects.toThrow('Survey 999 not found');
    });

    it('should use cached data when available', async () => {
      const cachedData = {
        metric_data: {
          survey_id: 1,
          survey_title: 'Cached Survey',
          total_responses: 50,
          completion_rate: 50.0,
          average_scores: {},
          response_distribution: {},
          generated_at: '2024-01-01T00:00:00.000Z',
        }
      };

      mockClient.query.mockResolvedValueOnce({ rows: [cachedData] });

      const result = await analyticsService.getSurveySummary(1, true);

      expect(result).toEqual(cachedData.metric_data);
      expect(mockClient.query).toHaveBeenCalledTimes(1); // Only cache query, not data generation
    });
  });

  describe('getCategoryAnalysis', () => {
    it('should generate category analysis with statistics', async () => {
      const mockCategoryData = {
        rows: [
          {
            category_code: 'engagement',
            category_name: 'Employee Engagement',
            response_count: '50',
            avg_score: '4.2',
            all_values: [1, 2, 3, 4, 5, 4, 4, 5, 5, 5], // Sample values
          },
          {
            category_code: 'satisfaction',
            category_name: 'Job Satisfaction',
            response_count: '30',
            avg_score: '3.8',
            all_values: [2, 3, 3, 4, 4, 4, 4, 5, 5, 3], // Sample values
          },
        ]
      };

      mockClient.query.mockResolvedValueOnce(mockCategoryData);

      const result = await analyticsService.getCategoryAnalysis(1, undefined, false);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        category_code: 'engagement',
        category_name: 'Employee Engagement',
        response_count: 50,
        average_score: 4.2,
        statistics: expect.objectContaining({
          mean: expect.any(Number),
          median: expect.any(Number),
          standardDeviation: expect.any(Number),
          count: 10,
        }),
        distribution: expect.arrayContaining([
          expect.objectContaining({
            range: expect.any(String),
            count: expect.any(Number),
            percentage: expect.any(Number),
          }),
        ]),
      });

      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should filter by specific category when provided', async () => {
      const mockCategoryData = {
        rows: [{
          category_code: 'engagement',
          category_name: 'Employee Engagement',
          response_count: '50',
          avg_score: '4.2',
          all_values: [4, 4, 5, 5, 5],
        }]
      };

      mockClient.query.mockResolvedValueOnce(mockCategoryData);

      await analyticsService.getCategoryAnalysis(1, 'engagement', false);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('AND sc.code = $2'),
        [1, 'engagement']
      );
    });
  });

  describe('getTrendAnalysis', () => {
    it('should generate trend analysis with correct data points', async () => {
      const mockTrendData = {
        rows: [
          {
            period_date: new Date('2024-01-01'),
            avg_value: '4.2',
            response_count: '25',
          },
          {
            period_date: new Date('2024-02-01'),
            avg_value: '4.5',
            response_count: '30',
          },
          {
            period_date: new Date('2024-03-01'),
            avg_value: '4.8',
            response_count: '35',
          },
        ]
      };

      // Mock cache query (returns null for no cached data)
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // Cache check
      mockClient.query.mockResolvedValueOnce(mockTrendData); // Data query

      const result = await analyticsService.getTrendAnalysis(1, undefined, 'monthly');

      expect(result).toEqual({
        period: 'monthly',
        data_points: [
          { date: '2024-01-01', value: 4.2, count: 25 },
          { date: '2024-02-01', value: 4.5, count: 30 },
          { date: '2024-03-01', value: 4.8, count: 35 },
        ],
        trend: 'increasing', // Should detect upward trend
        change_percentage: expect.any(Number),
      });

      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle empty trend data gracefully', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // Cache check
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // Data query

      const result = await analyticsService.getTrendAnalysis(1, undefined, 'daily');

      expect(result).toEqual({
        period: 'daily',
        data_points: [],
        trend: 'stable',
        change_percentage: 0,
      });
    });

    it('should use correct date truncation for different periods', async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      // Test different periods
      await analyticsService.getTrendAnalysis(1, undefined, 'weekly');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("DATE_TRUNC('week'"),
        expect.any(Array)
      );

      await analyticsService.getTrendAnalysis(1, undefined, 'quarterly');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("DATE_TRUNC('quarter'"),
        expect.any(Array)
      );
    });
  });

  describe('invalidateCache', () => {
    it('should delete cache entries for specific survey', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await analyticsService.invalidateCache(1);

      expect(mockClient.query).toHaveBeenCalledWith(
        'DELETE FROM analytics_cache WHERE survey_id = $1',
        [1]
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should delete specific metric when provided', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await analyticsService.invalidateCache(1, 'summary');

      expect(mockClient.query).toHaveBeenCalledWith(
        'DELETE FROM analytics_cache WHERE survey_id = $1 AND metric_name = $2',
        [1, 'summary']
      );
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors', async () => {
      mockConnectionPool.connect.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(analyticsService.getSurveySummary(1, false))
        .rejects.toThrow('Connection failed');
    });

    it('should handle query errors and release connection', async () => {
      mockClient.query.mockRejectedValueOnce(new Error('Query failed'));

      await expect(analyticsService.getSurveySummary(1, false))
        .rejects.toThrow('Query failed');

      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});