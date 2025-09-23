import React from 'react';
import { clsx } from 'clsx';
import { ProgressBarProps } from '../../types/ui';

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
  showLabel = false,
  label,
  className,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    xs: 'h-1',
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
    xl: 'h-6',
  };

  const colorClasses = {
    primary: 'bg-blue-600',
    secondary: 'bg-green-600',
    danger: 'bg-red-600',
    warning: 'bg-yellow-600',
    success: 'bg-green-600',
    info: 'bg-blue-500',
    gray: 'bg-gray-600',
  };

  const backgroundClasses = {
    primary: 'bg-blue-100',
    secondary: 'bg-green-100',
    danger: 'bg-red-100',
    warning: 'bg-yellow-100',
    success: 'bg-green-100',
    info: 'bg-blue-100',
    gray: 'bg-gray-100',
  };

  return (
    <div className={clsx('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {label || `Progress`}
          </span>
          {showLabel && (
            <span className="text-sm text-gray-600">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      <div
        className={clsx(
          'w-full rounded-full overflow-hidden',
          sizeClasses[size],
          backgroundClasses[color]
        )}
      >
        <div
          className={clsx(
            'h-full transition-all duration-300 ease-in-out rounded-full',
            colorClasses[color]
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
};

export default ProgressBar;