import React from 'react';
import { clsx } from 'clsx';
import { LayoutProps } from '../../types/ui';
import Header from './Header';
import Footer from './Footer';

const Layout: React.FC<LayoutProps> = ({
  children,
  header,
  sidebar,
  footer,
  className,
}) => {
  return (
    <div className={clsx('min-h-screen flex flex-col', className)}>
      {/* Header */}
      {header || <Header />}

      {/* Main content area */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        {sidebar && (
          <aside className="w-64 bg-white border-r border-gray-200 hidden lg:block">
            <div className="h-full overflow-y-auto">
              {sidebar}
            </div>
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden">
          <div className="container-responsive py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      {footer || <Footer />}
    </div>
  );
};

export default Layout;