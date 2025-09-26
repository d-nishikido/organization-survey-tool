import { useEffect, useState } from 'react';
import axios from 'axios';
import { EmployeeLayout } from '@/components/common';

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
    <EmployeeLayout>
      <div className="container mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Organization Survey Tool
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            従業員エンゲージメント向上のための組織改善ツール
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/surveys"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              利用可能な調査を見る
            </a>
            <a
              href="/login"
              className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              ログイン
            </a>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">完全匿名</h3>
            <p className="text-gray-600">
              個人を特定する情報は一切収集されません。安心してご回答ください。
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">簡単操作</h3>
            <p className="text-gray-600">
              直感的なインターフェースで、短時間で調査に回答できます。
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">データ活用</h3>
            <p className="text-gray-600">
              回答結果は組織改善のために活用され、フィードバックが提供されます。
            </p>
          </div>
        </div>

        {health && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">システム状態</h2>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full mb-2 ${
                  health.status === 'healthy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {health.status === 'healthy' ? '✓' : '✗'}
                </div>
                <div className="text-sm font-medium text-gray-900">状態</div>
                <div className="text-xs text-gray-600">{health.status}</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{Math.floor(health.uptime / 3600)}h</div>
                <div className="text-sm font-medium text-gray-900">稼働時間</div>
                <div className="text-xs text-gray-600">時間</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{health.environment}</div>
                <div className="text-sm font-medium text-gray-900">環境</div>
                <div className="text-xs text-gray-600">環境設定</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {new Date(health.timestamp).toLocaleTimeString('ja-JP')}
                </div>
                <div className="text-sm font-medium text-gray-900">最終確認</div>
                <div className="text-xs text-gray-600">時刻</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}