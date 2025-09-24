export interface ReportRequest {
  surveyId: number;
  format: 'pdf' | 'excel' | 'csv';
  template: 'summary' | 'comparison' | 'trends' | 'detailed';
  options: {
    includeRawData?: boolean;
    includeCharts?: boolean;
    dateRange?: {
      startDate?: string;
      endDate?: string;
    };
    categories?: string[];
  };
}

export interface ReportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  error?: string;
  request: ReportRequest;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'summary' | 'comparison' | 'trends' | 'detailed';
  supportedFormats: ('pdf' | 'excel' | 'csv')[];
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string[];
      borderColor?: string;
    }[];
  };
  options?: {
    title?: string;
    width?: number;
    height?: number;
  };
}

export interface ReportData {
  surveyTitle: string;
  generatedAt: string;
  summary: {
    totalResponses: number;
    completionRate: number;
    averageScores: Record<string, number>;
  };
  charts: ChartData[];
  tables: {
    title: string;
    headers: string[];
    rows: (string | number)[][];
  }[];
  categories: {
    category_code: string;
    category_name: string;
    response_count: number;
    average_score: number;
    statistics: {
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
    };
    distribution: { range: string; count: number; percentage: number }[];
  }[];
}