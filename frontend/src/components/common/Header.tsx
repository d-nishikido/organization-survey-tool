import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Button } from '../ui';
import { UserMenu } from '../ui/UserMenu';

interface HeaderProps {
  title?: string;
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
  actions?: React.ReactNode;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({
  title = 'Organization Survey Tool',
  onMenuToggle,
  showMenuButton = true,
  actions,
  className,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
    onMenuToggle?.();
  };

  return (
    <header className={clsx('bg-white shadow-sm border-b border-gray-200', className)}>
      <div className="container-responsive">
        <div className="flex items-center justify-between h-16">
          {/* Left section */}
          <div className="flex items-center">
            {showMenuButton && (
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden mr-2"
                onClick={handleMenuToggle}
                aria-label="Toggle menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </Button>
            )}
            
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
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            {actions}
            
            {/* User menu */}
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;