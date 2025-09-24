import puppeteer from 'puppeteer';
import ExcelJS from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';
import { ConnectionPool } from '../database/connection-pool';
import { AnalyticsService } from './analytics.service';
import { TemplateService } from './template.service';
import { ReportRequest, ReportJob, ReportData, ChartData } from '../types/reports';

export class ReportService {
  private analyticsService: AnalyticsService;
  private templateService: TemplateService;
  private jobs: Map<string, ReportJob> = new Map();

  constructor(connectionPool: ConnectionPool) {
    this.analyticsService = new AnalyticsService(connectionPool);
    this.templateService = new TemplateService();
  }

  /**
   * Generate a report asynchronously
   */
  async generateReport(request: ReportRequest): Promise<{ reportId: string }> {
    const reportId = uuidv4();
    const job: ReportJob = {
      id: reportId,
      status: 'pending',
      createdAt: new Date(),
      request,
    };

    this.jobs.set(reportId, job);

    // Start generation in background
    this.processReportGeneration(reportId).catch((error) => {
      const job = this.jobs.get(reportId);
      if (job) {
        job.status = 'failed';
        job.error = error.message;
        this.jobs.set(reportId, job);
      }
    });

    return { reportId };
  }

  /**
   * Get report status
   */
  getReportStatus(reportId: string): ReportJob | null {
    return this.jobs.get(reportId) || null;
  }

  /**
   * Get report download URL/path
   */
  async downloadReport(reportId: string): Promise<Buffer | null> {
    const job = this.jobs.get(reportId);
    if (!job || job.status !== 'completed' || !job.downloadUrl) {
      return null;
    }

    try {
      const filePath = path.join(process.cwd(), 'temp', job.downloadUrl);
      return await fs.readFile(filePath);
    } catch (error) {
      return null;
    }
  }

  /**
   * Process report generation
   */
  private async processReportGeneration(reportId: string): Promise<void> {
    const job = this.jobs.get(reportId);
    if (!job) return;

    job.status = 'processing';
    this.jobs.set(reportId, job);

    try {
      // Get analytics data
      const reportData = await this.gatherReportData(job.request);
      
      // Generate report based on format
      let fileName: string;
      switch (job.request.format) {
        case 'pdf':
          fileName = await this.generatePDFReport(reportData, job.request);
          break;
        case 'excel':
          fileName = await this.generateExcelReport(reportData, job.request);
          break;
        case 'csv':
          fileName = await this.generateCSVReport(reportData, job.request);
          break;
        default:
          throw new Error(`Unsupported format: ${job.request.format}`);
      }

      job.status = 'completed';
      job.completedAt = new Date();
      job.downloadUrl = fileName;
      this.jobs.set(reportId, job);
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      this.jobs.set(reportId, job);
      throw error;
    }
  }

  /**
   * Gather data for report generation
   */
  private async gatherReportData(request: ReportRequest): Promise<ReportData> {
    const summary = await this.analyticsService.getSurveySummary(request.surveyId);
    const categoryAnalysis = await this.analyticsService.getCategoryAnalysis(request.surveyId);

    // Create chart data
    const charts: ChartData[] = [];
    
    // Average scores chart
    if (request.options.includeCharts) {
      charts.push({
        type: 'bar',
        data: {
          labels: Object.keys(summary.average_scores),
          datasets: [{
            label: 'Average Score',
            data: Object.values(summary.average_scores),
            backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'],
          }]
        },
        options: {
          title: 'Category Average Scores',
          width: 600,
          height: 400,
        }
      });

      // Response distribution pie chart
      charts.push({
        type: 'pie',
        data: {
          labels: Object.keys(summary.response_distribution),
          datasets: [{
            label: 'Responses',
            data: Object.values(summary.response_distribution),
            backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
          }]
        },
        options: {
          title: 'Response Distribution',
          width: 400,
          height: 400,
        }
      });
    }

    // Create tables
    const tables = [];
    if (request.options.includeRawData) {
      tables.push({
        title: 'Category Analysis',
        headers: ['Category', 'Response Count', 'Average Score', 'Std Dev'],
        rows: categoryAnalysis.map(cat => [
          cat.category_name,
          cat.response_count,
          cat.average_score.toFixed(2),
          cat.statistics.standardDeviation.toFixed(2)
        ])
      });
    }

    return {
      surveyTitle: summary.survey_title,
      generatedAt: new Date().toISOString(),
      summary: {
        totalResponses: summary.total_responses,
        completionRate: summary.completion_rate,
        averageScores: summary.average_scores,
      },
      charts,
      tables,
      categories: categoryAnalysis,
    };
  }

  /**
   * Generate PDF report
   */
  private async generatePDFReport(data: ReportData, request: ReportRequest): Promise<string> {
    const fileName = `report-${request.surveyId}-${Date.now()}.pdf`;
    const filePath = path.join(process.cwd(), 'temp', fileName);

    // Ensure temp directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    const browser = await puppeteer.launch({ headless: true });
    try {
      const page = await browser.newPage();
      
      // Generate HTML content
      const html = await this.generateHTMLTemplate(data, request);
      await page.setContent(html);
      
      // Generate PDF
      await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });

      return fileName;
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate Excel report
   */
  private async generateExcelReport(data: ReportData, request: ReportRequest): Promise<string> {
    const fileName = `report-${request.surveyId}-${Date.now()}.xlsx`;
    const filePath = path.join(process.cwd(), 'temp', fileName);

    // Ensure temp directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    const workbook = new ExcelJS.Workbook();
    
    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.addRow(['Survey Report']);
    summarySheet.addRow(['Survey Title', data.surveyTitle]);
    summarySheet.addRow(['Generated At', data.generatedAt]);
    summarySheet.addRow(['Total Responses', data.summary.totalResponses]);
    summarySheet.addRow(['Completion Rate', `${data.summary.completionRate}%`]);
    summarySheet.addRow([]);
    
    // Average scores
    summarySheet.addRow(['Category', 'Average Score']);
    Object.entries(data.summary.averageScores).forEach(([category, score]) => {
      summarySheet.addRow([category, score]);
    });

    // Category details sheet
    if (request.options.includeRawData) {
      const categorySheet = workbook.addWorksheet('Category Analysis');
      categorySheet.addRow(['Category', 'Response Count', 'Average Score', 'Standard Deviation', 'Min', 'Max']);
      
      data.categories.forEach(category => {
        categorySheet.addRow([
          category.category_name,
          category.response_count,
          category.average_score,
          category.statistics.standardDeviation,
          category.statistics.min,
          category.statistics.max,
        ]);
      });
    }

    await workbook.xlsx.writeFile(filePath);
    return fileName;
  }

  /**
   * Generate CSV report
   */
  private async generateCSVReport(data: ReportData, request: ReportRequest): Promise<string> {
    const fileName = `report-${request.surveyId}-${Date.now()}.csv`;
    const filePath = path.join(process.cwd(), 'temp', fileName);

    // Ensure temp directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    const rows: string[] = [];
    rows.push('Category,Response Count,Average Score,Standard Deviation');
    
    data.categories.forEach(category => {
      rows.push([
        category.category_name,
        category.response_count,
        category.average_score.toFixed(2),
        category.statistics.standardDeviation.toFixed(2)
      ].join(','));
    });

    await fs.writeFile(filePath, rows.join('\n'));
    return fileName;
  }

  /**
   * Generate HTML template for PDF
   */
  private async generateHTMLTemplate(data: ReportData, request: ReportRequest): Promise<string> {
    return this.templateService.generateTemplateHTML(request.template, data);
  }

  /**
   * Get available templates
   */
  getAvailableTemplates() {
    return this.templateService.getAvailableTemplates();
  }



  /**
   * Clean up old report files
   */
  async cleanupOldReports(): Promise<void> {
    const tempDir = path.join(process.cwd(), 'temp');
    try {
      const files = await fs.readdir(tempDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or other error - ignore
    }

    // Clean up old jobs from memory
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    for (const [id, job] of this.jobs.entries()) {
      if (job.completedAt && now - job.completedAt.getTime() > maxAge) {
        this.jobs.delete(id);
      }
    }
  }
}