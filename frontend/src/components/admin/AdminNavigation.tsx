import { NavLink, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  description?: string;
}

const navigation: NavigationItem[] = [
  {
    name: 'ダッシュボード',
    href: '/admin',
    icon: '📊',
    description: '概要とサマリー'
  },
  {
    name: '調査管理',
    href: '/admin/surveys',
    icon: '📝',
    description: '調査の作成・編集'
  },
  {
    name: '結果分析',
    href: '/admin/analytics',
    icon: '📈',
    description: '回答結果の分析'
  },
  {
    name: 'ユーザー管理',
    href: '/admin/users',
    icon: '👥',
    description: '将来実装予定'
  },
  {
    name: 'システム設定',
    href: '/admin/settings',
    icon: '⚙️',
    description: '各種設定'
  }
];

export function AdminNavigation(): JSX.Element {
  const location = useLocation();

  return (
    <nav className="p-4 space-y-2">
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          管理メニュー
        </h2>
      </div>

      {navigation.map((item) => {
        const isActive = item.href === '/admin' 
          ? location.pathname === '/admin'
          : location.pathname.startsWith(item.href);

        return (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive: linkActive }) =>
              clsx(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                (isActive || linkActive)
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            <span className="mr-3 text-lg" role="img" aria-label={item.name}>
              {item.icon}
            </span>
            <div className="flex-1">
              <div className="font-medium">{item.name}</div>
              {item.description && (
                <div className="text-xs text-gray-500 mt-0.5">
                  {item.description}
                </div>
              )}
            </div>
          </NavLink>
        );
      })}

      {/* Status Section */}
      <div className="pt-6 mt-6 border-t border-gray-200">
        <div className="px-3 py-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            システム状態
          </div>
          <div className="flex items-center text-sm text-green-600">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
            正常稼働中
          </div>
        </div>
      </div>
    </nav>
  );
}