import { useEffect, useState } from 'react';
import axios from 'axios';

interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
}

export function HomePage(): JSX.Element {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await axios.get<HealthResponse>('/api/health');
        setHealth(response.data);
      } catch (err) {
        setError('Failed to connect to API');
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Organization Survey Tool
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            システムステータス
          </h2>

          {loading && (
            <p className="text-gray-600">読み込み中...</p>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {health && (
            <div className="space-y-2">
              <p className="text-gray-700">
                <span className="font-medium">ステータス:</span>{' '}
                <span className="text-green-600 font-semibold">{health.status}</span>
              </p>
              <p className="text-gray-700">
                <span className="font-medium">環境:</span> {health.environment}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">稼働時間:</span>{' '}
                {Math.floor(health.uptime / 60)} 分
              </p>
              <p className="text-gray-700 text-sm">
                <span className="font-medium">最終更新:</span>{' '}
                {new Date(health.timestamp).toLocaleString('ja-JP')}
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            開発中
          </h3>
          <p className="text-blue-700">
            このアプリケーションは現在開発中です。匿名従業員エンゲージメント調査機能を実装中です。
          </p>
        </div>
      </div>
    </div>
  );
}