import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/AuthContext';

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  requireAuth?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    label: 'ホーム',
    href: '/',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: '調査一覧',
    href: '/surveys',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    label: 'ダッシュボード',
    href: '/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    requireAuth: true,
  },
];

export function EmployeeNavigation(): JSX.Element {
  const location = useLocation();
  const { user } = useAuth();

  const isItemActive = (item: NavigationItem): boolean => {
    if (item.href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(item.href);
  };

  const isItemVisible = (item: NavigationItem): boolean => {
    if (!item.requireAuth) return true;
    return !!user;
  };

  return (
    <div className="flex space-x-8 overflow-x-auto">
      {navigationItems.filter(isItemVisible).map((item) => {
        const isActive = isItemActive(item);
        
        return (
          <Link
            key={item.href}
            to={item.href}
            className={clsx(
              'flex items-center px-1 py-4 border-b-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap',
              isActive
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="mr-2 flex-shrink-0">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}