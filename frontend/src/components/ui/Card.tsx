import React from 'react';
import { clsx } from 'clsx';
import { CardProps } from '../../types/ui';

const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  children,
  className,
  ...props
}) => {
  const baseClasses = 'bg-white rounded-lg';

  const variantClasses = {
    default: 'shadow-md',
    outlined: 'border border-gray-200',
    elevated: 'shadow-lg',
  };

  const paddingClasses = {
    xs: 'p-2',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  return (
    <div
      className={clsx(
        baseClasses,
        variantClasses[variant],
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;