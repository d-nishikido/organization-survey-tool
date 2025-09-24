import { ReportTemplate } from '../types/reports';

export class TemplateService {
  private templates: ReportTemplate[] = [
    {
      id: 'summary',
      name: '組織全体サマリーレポート',
      description: '組織全体の回答状況と主要指標をまとめたレポート',
      type: 'summary',
      supportedFormats: ['pdf', 'excel', 'csv'],
    },
    {
      id: 'comparison',
      name: '部門別比較レポート',
      description: '部門やカテゴリ間の比較分析レポート',
      type: 'comparison',
      supportedFormats: ['pdf', 'excel'],
    },
    {
      id: 'trends',
      name: '時系列トレンドレポート',
      description: '時間経過による変化を追跡するトレンド分析レポート',
      type: 'trends',
      supportedFormats: ['pdf', 'excel'],
    },
    {
      id: 'detailed',
      name: '詳細分析レポート',
      description: '統計情報と分布を含む詳細な分析レポート',
      type: 'detailed',
      supportedFormats: ['pdf', 'excel', 'csv'],
    },
  ];

  /**
   * Get all available report templates
   */
  getAvailableTemplates(): ReportTemplate[] {
    return this.templates;
  }

  /**
   * Get template by ID
   */
  getTemplateById(id: string): ReportTemplate | null {
    return this.templates.find(template => template.id === id) || null;
  }

  /**
   * Get templates by type
   */
  getTemplatesByType(type: 'summary' | 'comparison' | 'trends' | 'detailed'): ReportTemplate[] {
    return this.templates.filter(template => template.type === type);
  }

  /**
   * Get templates that support a specific format
   */
  getTemplatesByFormat(format: 'pdf' | 'excel' | 'csv'): ReportTemplate[] {
    return this.templates.filter(template => template.supportedFormats.includes(format));
  }

  /**
   * Validate template and format combination
   */
  isFormatSupportedByTemplate(templateId: string, format: 'pdf' | 'excel' | 'csv'): boolean {
    const template = this.getTemplateById(templateId);
    return template ? template.supportedFormats.includes(format) : false;
  }

  /**
   * Generate template-specific HTML content for PDF generation
   */
  generateTemplateHTML(templateId: string, data: any): string {
    const template = this.getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    switch (template.type) {
      case 'summary':
        return this.generateSummaryHTML(data);
      case 'comparison':
        return this.generateComparisonHTML(data);
      case 'trends':
        return this.generateTrendsHTML(data);
      case 'detailed':
        return this.generateDetailedHTML(data);
      default:
        throw new Error(`Unsupported template type: ${template.type}`);
    }
  }

  private generateSummaryHTML(data: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>組織全体サマリーレポート</title>
    <style>
        body { font-family: 'Noto Sans JP', Arial, sans-serif; margin: 0; padding: 20px; }
        .header { text-align: center; border-bottom: 3px solid #3B82F6; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 32px; color: #1F2937; margin-bottom: 10px; font-weight: bold; }
        .subtitle { font-size: 16px; color: #6B7280; }
        .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px; text-align: center; }
        .summary-value { font-size: 36px; font-weight: bold; color: #3B82F6; margin-bottom: 5px; }
        .summary-label { font-size: 14px; color: #64748B; }
        .category-section { margin-bottom: 40px; }
        .section-title { font-size: 24px; color: #1F2937; border-bottom: 2px solid #E2E8F0; padding-bottom: 10px; margin-bottom: 20px; }
        .category-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
        .category-item { background: white; border: 1px solid #E2E8F0; border-radius: 6px; padding: 15px; }
        .category-name { font-weight: bold; color: #374151; margin-bottom: 8px; }
        .category-score { font-size: 24px; font-weight: bold; color: #059669; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">組織全体サマリーレポート</div>
        <div class="subtitle">${data.surveyTitle}</div>
        <div class="subtitle">生成日: ${new Date(data.generatedAt).toLocaleDateString('ja-JP')}</div>
    </div>

    <div class="summary-grid">
        <div class="summary-card">
            <div class="summary-value">${data.summary.totalResponses}</div>
            <div class="summary-label">総回答数</div>
        </div>
        <div class="summary-card">
            <div class="summary-value">${data.summary.completionRate}%</div>
            <div class="summary-label">完了率</div>
        </div>
    </div>

    <div class="category-section">
        <h2 class="section-title">カテゴリ別平均スコア</h2>
        <div class="category-grid">
            ${Object.entries(data.summary.averageScores).map(([category, score]) => `
                <div class="category-item">
                    <div class="category-name">${category}</div>
                    <div class="category-score">${(score as number).toFixed(1)}</div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
  }

  private generateComparisonHTML(data: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>部門別比較レポート</title>
    <style>
        body { font-family: 'Noto Sans JP', Arial, sans-serif; margin: 0; padding: 20px; }
        .header { text-align: center; border-bottom: 3px solid #3B82F6; padding-bottom: 20px; margin-bottom: 30px; }
        .comparison-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .comparison-table th { background: #3B82F6; color: white; padding: 15px; text-align: left; }
        .comparison-table td { padding: 12px 15px; border-bottom: 1px solid #E2E8F0; }
        .comparison-table tbody tr:nth-child(even) { background: #F8FAFC; }
        .score-high { color: #059669; font-weight: bold; }
        .score-medium { color: #D97706; font-weight: bold; }
        .score-low { color: #DC2626; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">部門別比較レポート</div>
        <div class="subtitle">${data.surveyTitle}</div>
    </div>

    <table class="comparison-table">
        <thead>
            <tr>
                <th>カテゴリ</th>
                <th>回答数</th>
                <th>平均スコア</th>
                <th>標準偏差</th>
            </tr>
        </thead>
        <tbody>
            ${data.categories.map((cat: any) => `
                <tr>
                    <td>${cat.category_name}</td>
                    <td>${cat.response_count}</td>
                    <td class="${cat.average_score >= 4 ? 'score-high' : cat.average_score >= 3 ? 'score-medium' : 'score-low'}">
                        ${cat.average_score.toFixed(2)}
                    </td>
                    <td>${cat.statistics.standardDeviation.toFixed(2)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>`;
  }

  private generateTrendsHTML(data: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>時系列トレンドレポート</title>
    <style>
        body { font-family: 'Noto Sans JP', Arial, sans-serif; margin: 0; padding: 20px; }
        .header { text-align: center; border-bottom: 3px solid #3B82F6; padding-bottom: 20px; margin-bottom: 30px; }
        .trend-section { margin-bottom: 40px; }
        .trend-summary { background: #F0F9FF; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">時系列トレンドレポート</div>
        <div class="subtitle">${data.surveyTitle}</div>
    </div>

    <div class="trend-section">
        <div class="trend-summary">
            <h3>トレンド概要</h3>
            <p>この期間において、組織の指標は全体的に改善傾向を示しています。</p>
        </div>
    </div>
</body>
</html>`;
  }

  private generateDetailedHTML(data: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>詳細分析レポート</title>
    <style>
        body { font-family: 'Noto Sans JP', Arial, sans-serif; margin: 0; padding: 20px; }
        .header { text-align: center; border-bottom: 3px solid #3B82F6; padding-bottom: 20px; margin-bottom: 30px; }
        .detailed-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
        .detailed-table th { background: #1F2937; color: white; padding: 10px; text-align: left; }
        .detailed-table td { padding: 8px 10px; border-bottom: 1px solid #E2E8F0; }
        .stats-section { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
        .stats-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 15px; text-align: center; }
        .stats-value { font-size: 18px; font-weight: bold; color: #3B82F6; }
        .stats-label { font-size: 12px; color: #64748B; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">詳細分析レポート</div>
        <div class="subtitle">${data.surveyTitle}</div>
    </div>

    <table class="detailed-table">
        <thead>
            <tr>
                <th>カテゴリ</th>
                <th>回答数</th>
                <th>平均</th>
                <th>中央値</th>
                <th>標準偏差</th>
                <th>最小値</th>
                <th>最大値</th>
            </tr>
        </thead>
        <tbody>
            ${data.categories.map((cat: any) => `
                <tr>
                    <td>${cat.category_name}</td>
                    <td>${cat.response_count}</td>
                    <td>${cat.statistics.mean.toFixed(2)}</td>
                    <td>${cat.statistics.median.toFixed(2)}</td>
                    <td>${cat.statistics.standardDeviation.toFixed(2)}</td>
                    <td>${cat.statistics.min}</td>
                    <td>${cat.statistics.max}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>`;
  }
}