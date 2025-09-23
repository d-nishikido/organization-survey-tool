import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRoles?: UserRole[];
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requiredRoles = [],
  redirectTo = '/login',
}: ProtectedRouteProps): JSX.Element {
  const { isAuthenticated, hasAnyRole, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role requirements
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

// Convenience components for common role-based routes
export function AdminRoute({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <ProtectedRoute requiredRoles={['admin']}>
      {children}
    </ProtectedRoute>
  );
}

export function HRRoute({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <ProtectedRoute requiredRoles={['hr', 'admin']}>
      {children}
    </ProtectedRoute>
  );
}

export function EmployeeRoute({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <ProtectedRoute requiredRoles={['employee', 'hr', 'admin']}>
      {children}
    </ProtectedRoute>
  );
}