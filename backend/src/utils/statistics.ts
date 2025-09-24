/**
 * Statistical processing utilities for analytics
 */

export interface BasicStatistics {
  mean: number;
  median: number;
  standardDeviation: number;
  variance: number;
  min: number;
  max: number;
  count: number;
  quartiles: {
    q1: number;
    q2: number;
    q3: number;
  };
}

export interface TrendAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercentage: number;
  slope: number;
  correlation: number;
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  confidenceLevel: number;
}

export class StatisticsUtil {
  /**
   * Calculate basic statistics for a dataset
   */
  static calculateBasicStatistics(values: number[]): BasicStatistics {
    if (values.length === 0) {
      throw new Error('Cannot calculate statistics for empty dataset');
    }

    const sortedValues = [...values].sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / count;

    // Calculate variance and standard deviation
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
    const standardDeviation = Math.sqrt(variance);

    // Calculate median
    const median = this.calculateMedian(sortedValues);

    // Calculate quartiles
    const quartiles = this.calculateQuartiles(sortedValues);

    return {
      mean: Number(mean.toFixed(2)),
      median: Number(median.toFixed(2)),
      standardDeviation: Number(standardDeviation.toFixed(2)),
      variance: Number(variance.toFixed(2)),
      min: sortedValues[0],
      max: sortedValues[count - 1],
      count,
      quartiles: {
        q1: Number(quartiles.q1.toFixed(2)),
        q2: Number(quartiles.q2.toFixed(2)),
        q3: Number(quartiles.q3.toFixed(2)),
      },
    };
  }

  /**
   * Analyze trend in time series data
   */
  static analyzeTrend(dataPoints: Array<{ date: string; value: number }>): TrendAnalysis {
    if (dataPoints.length < 2) {
      return {
        trend: 'stable',
        changePercentage: 0,
        slope: 0,
        correlation: 0,
      };
    }

    // Convert dates to numeric values for linear regression
    const sortedData = dataPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const n = sortedData.length;

    // Use index as x-axis for trend calculation
    const xValues = Array.from({ length: n }, (_, i) => i);
    const yValues = sortedData.map(d => d.value);

    // Calculate linear regression
    const { slope, correlation } = this.linearRegression(xValues, yValues);

    // Calculate percentage change from first to last value
    const firstValue = yValues[0];
    const lastValue = yValues[n - 1];
    const changePercentage = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

    // Determine trend based on slope and significance
    let trend: 'increasing' | 'decreasing' | 'stable';
    const significanceThreshold = 0.1; // 10% threshold for trend significance

    if (Math.abs(changePercentage) < significanceThreshold) {
      trend = 'stable';
    } else if (slope > 0) {
      trend = 'increasing';
    } else {
      trend = 'decreasing';
    }

    return {
      trend,
      changePercentage: Number(changePercentage.toFixed(2)),
      slope: Number(slope.toFixed(4)),
      correlation: Number(correlation.toFixed(4)),
    };
  }

  /**
   * Calculate confidence interval for mean
   */
  static calculateConfidenceInterval(
    values: number[],
    confidenceLevel: number = 0.95
  ): ConfidenceInterval {
    if (values.length < 2) {
      throw new Error('Need at least 2 values to calculate confidence interval');
    }

    const stats = this.calculateBasicStatistics(values);
    const n = values.length;
    const standardError = stats.standardDeviation / Math.sqrt(n);

    // Use t-distribution for small samples, normal for large
    const tValue = n < 30 ? this.getTValue(confidenceLevel, n - 1) : this.getZValue(confidenceLevel);
    const marginOfError = tValue * standardError;

    return {
      lower: Number((stats.mean - marginOfError).toFixed(2)),
      upper: Number((stats.mean + marginOfError).toFixed(2)),
      confidenceLevel,
    };
  }

  /**
   * Calculate percentile value
   */
  static calculatePercentile(values: number[], percentile: number): number {
    if (percentile < 0 || percentile > 100) {
      throw new Error('Percentile must be between 0 and 100');
    }

    const sortedValues = [...values].sort((a, b) => a - b);
    const index = (percentile / 100) * (sortedValues.length - 1);

    if (Number.isInteger(index)) {
      return sortedValues[index];
    }

    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }

  /**
   * Calculate response distribution (histogram)
   */
  static calculateDistribution(
    values: number[],
    bins: number = 10
  ): Array<{ range: string; count: number; percentage: number }> {
    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const binSize = (max - min) / bins;

    const distribution = Array.from({ length: bins }, (_, i) => {
      const start = min + i * binSize;
      const end = i === bins - 1 ? max : start + binSize;
      const count = values.filter(v => v >= start && v <= end).length;

      return {
        range: `${start.toFixed(1)}-${end.toFixed(1)}`,
        count,
        percentage: Number(((count / values.length) * 100).toFixed(1)),
      };
    });

    return distribution;
  }

  /**
   * Calculate median value
   */
  private static calculateMedian(sortedValues: number[]): number {
    const n = sortedValues.length;
    const middle = Math.floor(n / 2);

    if (n % 2 === 0) {
      return (sortedValues[middle - 1] + sortedValues[middle]) / 2;
    } else {
      return sortedValues[middle];
    }
  }

  /**
   * Calculate quartiles
   */
  private static calculateQuartiles(sortedValues: number[]): {
    q1: number;
    q2: number;
    q3: number;
  } {
    const q2 = this.calculateMedian(sortedValues);

    const n = sortedValues.length;
    const middle = Math.floor(n / 2);

    let q1: number;
    let q3: number;

    if (n % 2 === 0) {
      q1 = this.calculateMedian(sortedValues.slice(0, middle));
      q3 = this.calculateMedian(sortedValues.slice(middle));
    } else {
      q1 = this.calculateMedian(sortedValues.slice(0, middle));
      q3 = this.calculateMedian(sortedValues.slice(middle + 1));
    }

    return { q1, q2, q3 };
  }

  /**
   * Linear regression calculation
   */
  private static linearRegression(xValues: number[], yValues: number[]): {
    slope: number;
    intercept: number;
    correlation: number;
  } {
    const n = xValues.length;
    const sumX = xValues.reduce((sum, x) => sum + x, 0);
    const sumY = yValues.reduce((sum, y) => sum + y, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
    const sumYY = yValues.reduce((sum, y) => sum + y * y, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate correlation coefficient
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    const correlation = denominator !== 0 ? numerator / denominator : 0;

    return { slope, intercept, correlation };
  }

  /**
   * Get t-value for confidence interval (approximation for common confidence levels)
   */
  private static getTValue(confidenceLevel: number, degreesOfFreedom: number): number {
    // Simplified t-table lookup for common confidence levels
    // For production, consider using a proper statistical library
    if (confidenceLevel === 0.95) {
      if (degreesOfFreedom >= 30) return 1.96;
      if (degreesOfFreedom >= 20) return 2.09;
      if (degreesOfFreedom >= 10) return 2.23;
      return 2.78; // Conservative estimate for small samples
    }

    if (confidenceLevel === 0.99) {
      if (degreesOfFreedom >= 30) return 2.58;
      if (degreesOfFreedom >= 20) return 2.85;
      return 3.25; // Conservative estimate
    }

    // Default to 95% confidence
    return 1.96;
  }

  /**
   * Get z-value for confidence interval
   */
  private static getZValue(confidenceLevel: number): number {
    if (confidenceLevel === 0.90) return 1.645;
    if (confidenceLevel === 0.95) return 1.96;
    if (confidenceLevel === 0.99) return 2.576;

    // Default to 95% confidence
    return 1.96;
  }
}