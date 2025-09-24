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
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  error?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'summary' | 'comparison' | 'trends' | 'detailed';
  supportedFormats: ('pdf' | 'excel' | 'csv')[];
}