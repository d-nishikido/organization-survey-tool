
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function SurveyListPage(): JSX.Element {
  const { sessionId } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          利用可能な調査
        </h1>

        {sessionId && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-700">
              匿名セッション: {sessionId.substring(0, 16)}...
            </p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Placeholder survey cards */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              従業員エンゲージメント調査 2024
            </h3>
            <p className="text-gray-600 mb-4">
              年次従業員満足度とエンゲージメントに関する調査です。
            </p>
            <div className="mb-4">
              <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                実施中
              </span>
            </div>
            <Link
              to="/survey/engagement-2024"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              調査を開始
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              職場環境評価
            </h3>
            <p className="text-gray-600 mb-4">
              職場の安全性、快適性に関する評価調査です。
            </p>
            <div className="mb-4">
              <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                準備中
              </span>
            </div>
            <button
              disabled
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed"
            >
              近日公開
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              テクノロジー活用度調査
            </h3>
            <p className="text-gray-600 mb-4">
              業務でのデジタルツール活用状況に関する調査です。
            </p>
            <div className="mb-4">
              <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                終了
              </span>
            </div>
            <Link
              to="/results/tech-usage"
              className="inline-flex items-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
            >
              結果を見る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}