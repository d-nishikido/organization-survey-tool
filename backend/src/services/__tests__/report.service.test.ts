import { ReportService } from '../report.service';
import { TemplateService } from '../template.service';
import { ConnectionPool } from '../../database/connection-pool';

// Mock ConnectionPool
const mockConnectionPool = {
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn(),
} as unknown as ConnectionPool;

// Mock AnalyticsService
jest.mock('../analytics.service', () => ({
  AnalyticsService: jest.fn().mockImplementation(() => ({
    getSurveySummary: jest.fn().mockResolvedValue({
      survey_id: 1,
      survey_title: 'Test Survey',
      total_responses: 100,
      completion_rate: 85,
      average_scores: { engagement: 4.2, satisfaction: 3.8 },
      response_distribution: { '1-2': 10, '3-4': 40, '5': 50 },
      generated_at: new Date().toISOString(),
    }),
    getCategoryAnalysis: jest.fn().mockResolvedValue([
        {
          category_code: 'engagement',
          category_name: 'Engagement',
          response_count: 100,
          average_score: 4.2,
          statistics: {
            mean: 4.2,
            median: 4.0,
            standardDeviation: 0.8,
            variance: 0.64,
            min: 1,
            max: 5,
            count: 100,
            quartiles: { q1: 3.5, q2: 4.0, q3: 4.5 },
          },
          distribution: [
            { range: '1-2', count: 10, percentage: 10 },
            { range: '3-4', count: 40, percentage: 40 },
            { range: '5', count: 50, percentage: 50 },
          ],
        },
      ]),
  })),
}));

describe('ReportService', () => {
  let reportService: ReportService;
  let templateService: TemplateService;

  beforeEach(() => {
    reportService = new ReportService(mockConnectionPool);
    templateService = new TemplateService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateReport', () => {
    it('should generate a report job with valid ID', async () => {
      const request = {
        surveyId: 1,
        format: 'pdf' as const,
        template: 'summary' as const,
        options: {
          includeRawData: true,
          includeCharts: true,
        },
      };

      const result = await reportService.generateReport(request);
      
      expect(result).toHaveProperty('reportId');
      expect(typeof result.reportId).toBe('string');
      expect(result.reportId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should create job with pending status', async () => {
      const request = {
        surveyId: 1,
        format: 'excel' as const,
        template: 'comparison' as const,
        options: {},
      };

      const { reportId } = await reportService.generateReport(request);
      const job = reportService.getReportStatus(reportId);
      
      expect(job).toBeTruthy();
      expect(job?.status).toBe('pending');
      expect(job?.request).toEqual(request);
    });
  });

  describe('getReportStatus', () => {
    it('should return null for non-existent report', () => {
      const status = reportService.getReportStatus('non-existent-id');
      expect(status).toBeNull();
    });

    it('should return job status for existing report', async () => {
      const request = {
        surveyId: 1,
        format: 'csv' as const,
        template: 'detailed' as const,
        options: {},
      };

      const { reportId } = await reportService.generateReport(request);
      const status = reportService.getReportStatus(reportId);
      
      expect(status).toBeTruthy();
      expect(status?.id).toBe(reportId);
      expect(status?.status).toBe('pending');
    });
  });

  describe('getAvailableTemplates', () => {
    it('should return available templates', () => {
      const templates = reportService.getAvailableTemplates();
      
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      
      templates.forEach(template => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('type');
        expect(template).toHaveProperty('supportedFormats');
        expect(Array.isArray(template.supportedFormats)).toBe(true);
      });
    });
  });
});

describe('TemplateService', () => {
  let templateService: TemplateService;

  beforeEach(() => {
    templateService = new TemplateService();
  });

  describe('getAvailableTemplates', () => {
    it('should return all predefined templates', () => {
      const templates = templateService.getAvailableTemplates();
      
      expect(templates).toHaveLength(4);
      expect(templates.map(t => t.id)).toContain('summary');
      expect(templates.map(t => t.id)).toContain('comparison');
      expect(templates.map(t => t.id)).toContain('trends');
      expect(templates.map(t => t.id)).toContain('detailed');
    });
  });

  describe('getTemplateById', () => {
    it('should return template by valid ID', () => {
      const template = templateService.getTemplateById('summary');
      
      expect(template).toBeTruthy();
      expect(template?.id).toBe('summary');
      expect(template?.type).toBe('summary');
    });

    it('should return null for invalid ID', () => {
      const template = templateService.getTemplateById('invalid');
      expect(template).toBeNull();
    });
  });

  describe('isFormatSupportedByTemplate', () => {
    it('should validate supported format combinations', () => {
      expect(templateService.isFormatSupportedByTemplate('summary', 'pdf')).toBe(true);
      expect(templateService.isFormatSupportedByTemplate('summary', 'excel')).toBe(true);
      expect(templateService.isFormatSupportedByTemplate('summary', 'csv')).toBe(true);
      
      expect(templateService.isFormatSupportedByTemplate('comparison', 'pdf')).toBe(true);
      expect(templateService.isFormatSupportedByTemplate('comparison', 'excel')).toBe(true);
      expect(templateService.isFormatSupportedByTemplate('comparison', 'csv')).toBe(false);
    });

    it('should return false for invalid template', () => {
      expect(templateService.isFormatSupportedByTemplate('invalid', 'pdf')).toBe(false);
    });
  });

  describe('generateTemplateHTML', () => {
    const mockData = {
      surveyTitle: 'Test Survey',
      generatedAt: new Date().toISOString(),
      summary: {
        totalResponses: 100,
        completionRate: 85,
        averageScores: { engagement: 4.2, satisfaction: 3.8 },
      },
      categories: [
        {
          category_name: 'Engagement',
          response_count: 100,
          average_score: 4.2,
          statistics: {
            mean: 4.2,
            median: 4.0,
            standardDeviation: 0.8,
            min: 1,
            max: 5,
          },
        },
      ],
      charts: [],
      tables: [],
    };

    it('should generate HTML for summary template', () => {
      const html = templateService.generateTemplateHTML('summary', mockData);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('組織全体サマリーレポート');
      expect(html).toContain('Test Survey');
      expect(html).toContain('100'); // total responses
      expect(html).toContain('85%'); // completion rate
    });

    it('should generate HTML for comparison template', () => {
      const html = templateService.generateTemplateHTML('comparison', mockData);
      
      expect(html).toContain('部門別比較レポート');
      expect(html).toContain('Engagement');
      expect(html).toContain('4.2');
    });

    it('should throw error for invalid template', () => {
      expect(() => {
        templateService.generateTemplateHTML('invalid', mockData);
      }).toThrow('Template not found: invalid');
    });
  });
});