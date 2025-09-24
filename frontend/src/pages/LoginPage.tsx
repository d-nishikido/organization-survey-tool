
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';

export function LoginPage(): JSX.Element {
  const { isAuthenticated, login } = useAuth();
  const location = useLocation();

  // Redirect to intended page or home if already authenticated
  if (isAuthenticated) {
    const from = (location.state as any)?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  // Demo login handler
  const handleDemoLogin = (role: UserRole) => {
    const demoUsers = {
      hr: {
        id: 'demo-hr',
        email: 'hr@example.com',
        name: 'HR Manager',
        role: 'hr' as UserRole,
        department: '人事部'
      },
      admin: {
        id: 'demo-admin',
        email: 'admin@example.com',
        name: 'System Admin',
        role: 'admin' as UserRole,
        department: 'IT部'
      },
      employee: {
        id: 'demo-emp',
        email: 'employee@example.com',
        name: 'Employee User',
        role: 'employee' as UserRole,
        department: '営業部'
      }
    };
    
    login(demoUsers[role]);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          組織調査ツールにログイン
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Microsoft365アカウントでログインしてください
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <button
              type="button"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled
            >
              Microsoft365でログイン
            </button>
            
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">または</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => window.location.href = '/'}
            >
              匿名で調査に参加
            </button>
          </div>

          <div className="mt-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    開発中
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Microsoft365 SSO連携は現在開発中です。
                      匿名での調査参加は利用可能です。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Demo Login Section */}
          <div className="mt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="mb-3">
                <h3 className="text-sm font-medium text-blue-800">
                  デモログイン（開発・テスト用）
                </h3>
                <p className="mt-1 text-xs text-blue-600">
                  以下のデモユーザーでログインできます
                </p>
              </div>
              
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('hr')}
                  className="w-full flex justify-between items-center py-2 px-3 border border-blue-300 rounded-md shadow-sm text-sm bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-gray-900">HR Manager</span>
                    <span className="text-xs text-gray-500">調査作成・管理が可能</span>
                  </div>
                  <span className="text-blue-600">→</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('admin')}
                  className="w-full flex justify-between items-center py-2 px-3 border border-blue-300 rounded-md shadow-sm text-sm bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-gray-900">System Admin</span>
                    <span className="text-xs text-gray-500">全機能へのアクセス可能</span>
                  </div>
                  <span className="text-blue-600">→</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('employee')}
                  className="w-full flex justify-between items-center py-2 px-3 border border-blue-300 rounded-md shadow-sm text-sm bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-gray-900">Employee</span>
                    <span className="text-xs text-gray-500">調査回答のみ可能</span>
                  </div>
                  <span className="text-blue-600">→</span>
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-600">
                  ※ この機能は開発環境専用です。本番環境では無効化されます。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}