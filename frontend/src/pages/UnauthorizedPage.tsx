
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function UnauthorizedPage(): JSX.Element {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-400">403</h1>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
            アクセス権限がありません
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            このページにアクセスする権限がありません。
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {user && (
            <div className="mb-6 p-4 bg-gray-50 rounded-md">
              <h3 className="text-sm font-medium text-gray-900">現在のユーザー</h3>
              <p className="text-sm text-gray-600">{user.name}</p>
              <p className="text-sm text-gray-600">権限: {user.role}</p>
            </div>
          )}

          <div className="space-y-4">
            <Link
              to="/"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ホームに戻る
            </Link>

            {user && (
              <button
                onClick={logout}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ログアウト
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}