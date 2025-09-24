import { StatisticsUtil } from '../statistics';

describe('StatisticsUtil', () => {
  describe('calculateBasicStatistics', () => {
    it('should calculate correct basic statistics', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = StatisticsUtil.calculateBasicStatistics(values);

      expect(result).toEqual({
        mean: 5.5,
        median: 5.5,
        standardDeviation: 2.87,
        variance: 8.25,
        min: 1,
        max: 10,
        count: 10,
        quartiles: {
          q1: 3,
          q2: 5.5,
          q3: 8,
        },
      });
    });

    it('should handle odd number of values', () => {
      const values = [1, 3, 5, 7, 9];
      const result = StatisticsUtil.calculateBasicStatistics(values);

      expect(result.median).toBe(5);
      expect(result.count).toBe(5);
    });

    it('should handle single value', () => {
      const values = [42];
      const result = StatisticsUtil.calculateBasicStatistics(values);

      expect(result.mean).toBe(42);
      expect(result.median).toBe(42);
      expect(result.min).toBe(42);
      expect(result.max).toBe(42);
      expect(result.standardDeviation).toBe(0);
      expect(result.variance).toBe(0);
    });

    it('should throw error for empty array', () => {
      expect(() => StatisticsUtil.calculateBasicStatistics([]))
        .toThrow('Cannot calculate statistics for empty dataset');
    });
  });

  describe('analyzeTrend', () => {
    it('should detect increasing trend', () => {
      const dataPoints = [
        { date: '2024-01-01', value: 2 },
        { date: '2024-02-01', value: 3 },
        { date: '2024-03-01', value: 4 },
        { date: '2024-04-01', value: 5 },
      ];

      const result = StatisticsUtil.analyzeTrend(dataPoints);

      expect(result.trend).toBe('increasing');
      expect(result.changePercentage).toBe(150); // (5-2)/2 * 100
      expect(result.slope).toBeGreaterThan(0);
    });

    it('should detect decreasing trend', () => {
      const dataPoints = [
        { date: '2024-01-01', value: 5 },
        { date: '2024-02-01', value: 4 },
        { date: '2024-03-01', value: 3 },
        { date: '2024-04-01', value: 2 },
      ];

      const result = StatisticsUtil.analyzeTrend(dataPoints);

      expect(result.trend).toBe('decreasing');
      expect(result.changePercentage).toBe(-60); // (2-5)/5 * 100
      expect(result.slope).toBeLessThan(0);
    });

    it('should detect stable trend', () => {
      const dataPoints = [
        { date: '2024-01-01', value: 4.0 },
        { date: '2024-02-01', value: 4.01 },
        { date: '2024-03-01', value: 3.99 },
        { date: '2024-04-01', value: 4.00 },
      ];

      const result = StatisticsUtil.analyzeTrend(dataPoints);

      expect(result.trend).toBe('stable');
      expect(Math.abs(result.changePercentage)).toBeLessThan(1); // Very small change for stable trend
    });

    it('should handle insufficient data', () => {
      const dataPoints = [{ date: '2024-01-01', value: 5 }];
      const result = StatisticsUtil.analyzeTrend(dataPoints);

      expect(result.trend).toBe('stable');
      expect(result.changePercentage).toBe(0);
      expect(result.slope).toBe(0);
      expect(result.correlation).toBe(0);
    });

    it('should handle empty data', () => {
      const result = StatisticsUtil.analyzeTrend([]);

      expect(result.trend).toBe('stable');
      expect(result.changePercentage).toBe(0);
    });
  });

  describe('calculateConfidenceInterval', () => {
    it('should calculate 95% confidence interval', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = StatisticsUtil.calculateConfidenceInterval(values, 0.95);

      expect(result.confidenceLevel).toBe(0.95);
      expect(result.lower).toBeLessThan(result.upper);
      expect(result.lower).toBeGreaterThan(0);
      expect(result.upper).toBeLessThan(15);
    });

    it('should calculate 99% confidence interval', () => {
      const values = [1, 2, 3, 4, 5];
      const result = StatisticsUtil.calculateConfidenceInterval(values, 0.99);

      expect(result.confidenceLevel).toBe(0.99);
      // 99% interval should be wider than 95%
      const ci95 = StatisticsUtil.calculateConfidenceInterval(values, 0.95);
      expect(result.upper - result.lower).toBeGreaterThan(ci95.upper - ci95.lower);
    });

    it('should throw error for insufficient data', () => {
      expect(() => StatisticsUtil.calculateConfidenceInterval([5]))
        .toThrow('Need at least 2 values to calculate confidence interval');
    });
  });

  describe('calculatePercentile', () => {
    it('should calculate correct percentiles', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      expect(StatisticsUtil.calculatePercentile(values, 50)).toBe(5.5); // median
      expect(StatisticsUtil.calculatePercentile(values, 25)).toBe(3.25); // Q1
      expect(StatisticsUtil.calculatePercentile(values, 75)).toBe(7.75); // Q3
      expect(StatisticsUtil.calculatePercentile(values, 0)).toBe(1); // min
      expect(StatisticsUtil.calculatePercentile(values, 100)).toBe(10); // max
    });

    it('should throw error for invalid percentile', () => {
      const values = [1, 2, 3, 4, 5];

      expect(() => StatisticsUtil.calculatePercentile(values, -1))
        .toThrow('Percentile must be between 0 and 100');

      expect(() => StatisticsUtil.calculatePercentile(values, 101))
        .toThrow('Percentile must be between 0 and 100');
    });
  });

  describe('calculateDistribution', () => {
    it('should create histogram with correct bins', () => {
      const values = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5];
      const result = StatisticsUtil.calculateDistribution(values, 5);

      expect(result).toHaveLength(5);
      expect(result.every(bin => bin.count >= 0)).toBe(true);
      expect(result.every(bin => bin.percentage >= 0 && bin.percentage <= 100)).toBe(true);

      // Total count should equal original data length
      const totalCount = result.reduce((sum, bin) => sum + bin.count, 0);
      expect(totalCount).toBe(values.length);

      // Total percentage should be 100%
      const totalPercentage = result.reduce((sum, bin) => sum + bin.percentage, 0);
      expect(totalPercentage).toBeCloseTo(100, 1);
    });

    it('should handle empty array', () => {
      const result = StatisticsUtil.calculateDistribution([]);
      expect(result).toEqual([]);
    });

    it('should handle single value', () => {
      const result = StatisticsUtil.calculateDistribution([5], 3);
      expect(result).toHaveLength(3);
      expect(result[0].count).toBe(1);
      expect(result[0].percentage).toBe(100);
    });
  });

  describe('edge cases', () => {
    it('should handle array with duplicate values', () => {
      const values = [5, 5, 5, 5, 5];
      const stats = StatisticsUtil.calculateBasicStatistics(values);

      expect(stats.mean).toBe(5);
      expect(stats.median).toBe(5);
      expect(stats.min).toBe(5);
      expect(stats.max).toBe(5);
      expect(stats.standardDeviation).toBe(0);
      expect(stats.variance).toBe(0);
    });

    it('should handle very large numbers', () => {
      const values = [1000000, 2000000, 3000000];
      const stats = StatisticsUtil.calculateBasicStatistics(values);

      expect(stats.mean).toBe(2000000);
      expect(stats.median).toBe(2000000);
    });

    it('should handle negative numbers', () => {
      const values = [-5, -3, -1, 1, 3, 5];
      const stats = StatisticsUtil.calculateBasicStatistics(values);

      expect(stats.mean).toBe(0);
      expect(stats.min).toBe(-5);
      expect(stats.max).toBe(5);
    });
  });
});