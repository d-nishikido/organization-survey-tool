import React, { useState } from 'react';
import { Card, Button } from '@/components/ui';
import ChartComponents from './ChartComponents';

interface TrendData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
}

interface CategoryData {
  category: string;
  averageScore: number;
  responseCount: number;
  distribution: Record<string, number>;
}

interface TrendAnalysisProps {
  data: TrendData;
  categoryData: CategoryData[];
}

const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ data, categoryData }) => {
  const [activeView, setActiveView] = useState<'trends' | 'distribution' | 'comparison'>('trends');

  // Generate distribution data for pie chart
  const distributionData = {
    labels: Object.keys(categoryData[0]?.distribution || {}),
    datasets: [{
      label: 'Response Distribution',
      data: Object.values(categoryData[0]?.distribution || {}),
      color: '#8B5CF6',
    }]
  };

  // Generate comparison data for bar chart
  const comparisonData = {
    labels: categoryData.map(cat => cat.category),
    datasets: [
      {
        label: '平均スコア',
        data: categoryData.map(cat => cat.averageScore),
        color: '#3B82F6',
      },
      {
        label: '回答数 (×0.001)',
        data: categoryData.map(cat => cat.responseCount / 1000),
        color: '#10B981',
      }
    ]
  };

  const renderInsights = () => {
    const totalResponses = categoryData.reduce((sum, cat) => sum + cat.responseCount, 0);
    const highestScoreCategory = categoryData.reduce((max, cat) => 
      cat.averageScore > max.averageScore ? cat : max
    );
    const lowestScoreCategory = categoryData.reduce((min, cat) => 
      cat.averageScore < min.averageScore ? cat : min
    );

    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">分析インサイト</h4>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            最高スコアカテゴリ: <strong className="ml-1">{highestScoreCategory.category}</strong> 
            ({highestScoreCategory.averageScore.toFixed(1)}点)
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
            改善余地カテゴリ: <strong className="ml-1">{lowestScoreCategory.category}</strong> 
            ({lowestScoreCategory.averageScore.toFixed(1)}点)
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            総回答数: <strong className="ml-1">{totalResponses.toLocaleString()}</strong>件
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
            全体平均スコア: <strong className="ml-1">
              {(categoryData.reduce((sum, cat) => sum + cat.averageScore, 0) / categoryData.length).toFixed(1)}
            </strong>点
          </div>
        </div>
      </div>
    );
  };

  const renderRecommendations = () => {
    const lowestScoreCategory = categoryData.reduce((min, cat) => 
      cat.averageScore < min.averageScore ? cat : min
    );

    return (
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-3">改善提案</h4>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-start">
            <span className="text-blue-500 mr-2">💡</span>
            <span>
              <strong>{lowestScoreCategory.category}</strong>カテゴリのスコア改善に重点的に取り組むことをお勧めします
            </span>
          </div>
          <div className="flex items-start">
            <span className="text-blue-500 mr-2">📊</span>
            <span>
              回答率向上のため、調査の簡素化や回答インセンティブの検討をお勧めします
            </span>
          </div>
          <div className="flex items-start">
            <span className="text-blue-500 mr-2">📅</span>
            <span>
              定期的なフォローアップ調査により、改善施策の効果を測定することをお勧めします
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card variant="default" padding="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            詳細トレンド分析
          </h3>
          <div className="flex space-x-2">
            <Button
              variant={activeView === 'trends' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveView('trends')}
            >
              トレンド
            </Button>
            <Button
              variant={activeView === 'distribution' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveView('distribution')}
            >
              分布
            </Button>
            <Button
              variant={activeView === 'comparison' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveView('comparison')}
            >
              比較
            </Button>
          </div>
        </div>

        {/* Chart Display */}
        <div className="h-80">
          {activeView === 'trends' && (
            <ChartComponents
              type="area"
              data={data}
              height={320}
            />
          )}
          {activeView === 'distribution' && (
            <ChartComponents
              type="pie"
              data={distributionData}
              height={320}
            />
          )}
          {activeView === 'comparison' && (
            <ChartComponents
              type="bar"
              data={comparisonData}
              height={320}
            />
          )}
        </div>

        {/* Analysis Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {renderInsights()}
          {renderRecommendations()}
        </div>

        {/* Detailed Stats Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  カテゴリ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  平均スコア
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  回答数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  最高評価割合
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  改善余地
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categoryData.map((category, index) => {
                const distributionValues = Object.values(category.distribution);
                const totalDistribution = distributionValues.reduce((sum, val) => sum + val, 0);
                const highestRating = distributionValues[distributionValues.length - 1] || 0;
                const highestRatingPercentage = totalDistribution > 0 ? (highestRating / totalDistribution * 100) : 0;
                const improvementPotential = 5 - category.averageScore;
                
                return (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                      {category.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className={`w-12 h-2 rounded-full mr-2 ${
                          category.averageScore >= 4 ? 'bg-green-400' :
                          category.averageScore >= 3 ? 'bg-yellow-400' : 'bg-red-400'
                        }`}>
                          <div 
                            className="h-2 rounded-full bg-current opacity-60"
                            style={{ width: `${(category.averageScore / 5) * 100}%` }}
                          />
                        </div>
                        <span className="font-medium">
                          {category.averageScore.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.responseCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {highestRatingPercentage.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        improvementPotential <= 1 ? 'bg-green-100 text-green-800' :
                        improvementPotential <= 2 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {improvementPotential <= 1 ? '良好' :
                         improvementPotential <= 2 ? '普通' : '要改善'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};

export default TrendAnalysis;