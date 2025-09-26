import React from 'react';
import { Outlet } from 'react-router-dom';
import { EmployeeNavigation } from './EmployeeNavigation';
import { UserMenu } from '@/components/ui/UserMenu';

interface EmployeeLayoutProps {
  children?: React.ReactNode;
  title?: string;
  showNavigation?: boolean;
}

export function EmployeeLayout({ 
  children, 
  title = 'Organization Survey Tool',
  showNavigation = true 
}: EmployeeLayoutProps): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <h1 className="ml-3 text-xl font-semibold text-gray-900 hidden sm:block">
                {title}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      {showNavigation && (
        <nav className="bg-white border-b border-gray-200">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <EmployeeNavigation />
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {children || <Outlet />}
      </main>
    </div>
  );
}