import React from 'react';
import { clsx } from 'clsx';
import { NavigationProps } from '../../types/ui';

const Navigation: React.FC<NavigationProps> = ({
  items,
  variant = 'horizontal',
  className,
}) => {
  const baseClasses = 'flex';
  
  const variantClasses = {
    horizontal: 'flex-row space-x-1',
    vertical: 'flex-col space-y-1',
    mobile: 'flex-col space-y-1 p-4',
  };

  const linkBaseClasses = 'px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200';
  
  const linkClasses = {
    active: 'bg-blue-100 text-blue-700',
    inactive: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
  };

  const renderNavItem = (item: typeof items[0], index: number) => (
    <a
      key={`${item.href}-${index}`}
      href={item.href}
      className={clsx(
        linkBaseClasses,
        item.isActive ? linkClasses.active : linkClasses.inactive
      )}
      aria-current={item.isActive ? 'page' : undefined}
    >
      <div className="flex items-center">
        {item.icon && (
          <span className="mr-2 w-5 h-5 flex-shrink-0">
            {item.icon}
          </span>
        )}
        <span>{item.label}</span>
      </div>
    </a>
  );

  return (
    <nav className={clsx(baseClasses, variantClasses[variant], className)}>
      {items.map(renderNavItem)}
    </nav>
  );
};

export default Navigation;