import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';

interface PermissionCheckProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  fallback?: React.ReactNode;
  showBadge?: boolean;
}

export function PermissionCheck({
  children,
  requiredRoles = [],
  fallback,
  showBadge = false
}: PermissionCheckProps): JSX.Element {
  const { hasAnyRole, user } = useAuth();

  const hasPermission = requiredRoles.length === 0 || hasAnyRole(requiredRoles);

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-yellow-400 text-xl">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              アクセス権限が不足しています
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                この機能には{' '}
                <span className="font-medium">
                  {requiredRoles.join('、')}
                </span>{' '}
                の権限が必要です。
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {showBadge && user?.role && (
        <div className="absolute top-0 right-0 -mt-2 -mr-2 z-10">
          <PermissionBadge role={user.role} />
        </div>
      )}
      {children}
    </div>
  );
}

interface PermissionBadgeProps {
  role: UserRole;
}

export function PermissionBadge({ role }: PermissionBadgeProps): JSX.Element {
  const badgeConfig = {
    admin: {
      label: '管理者',
      className: 'bg-red-100 text-red-800',
      icon: '👑'
    },
    hr: {
      label: 'HR',
      className: 'bg-blue-100 text-blue-800',
      icon: '👔'
    },
    employee: {
      label: '従業員',
      className: 'bg-green-100 text-green-800',
      icon: '👤'
    }
  };

  const config = badgeConfig[role];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      <span className="mr-1" role="img" aria-label={config.label}>
        {config.icon}
      </span>
      {config.label}
    </span>
  );
}

interface AdminSectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function AdminSection({ children, title, description }: AdminSectionProps): JSX.Element {
  return (
    <PermissionCheck requiredRoles={['hr', 'admin']}>
      <div className="bg-white shadow rounded-lg">
        {(title || description) && (
          <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
            {title && (
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {title}
              </h3>
            )}
            {description && (
              <p className="mt-1 text-sm text-gray-500">
                {description}
              </p>
            )}
          </div>
        )}
        <div className="px-4 py-5 sm:p-6">
          {children}
        </div>
      </div>
    </PermissionCheck>
  );
}