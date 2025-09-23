import React from 'react';
import { clsx } from 'clsx';
import { TypographyProps } from '../../types/ui';

const Typography: React.FC<TypographyProps> = ({
  variant = 'body1',
  color = 'inherit',
  align = 'left',
  component,
  children,
  className,
  ...props
}) => {
  const variantClasses = {
    h1: 'text-4xl font-bold leading-tight',
    h2: 'text-3xl font-bold leading-tight',
    h3: 'text-2xl font-semibold leading-tight',
    h4: 'text-xl font-semibold leading-tight',
    h5: 'text-lg font-medium leading-tight',
    h6: 'text-base font-medium leading-tight',
    body1: 'text-base leading-normal',
    body2: 'text-sm leading-normal',
    caption: 'text-xs leading-normal',
    overline: 'text-xs font-medium uppercase tracking-wide leading-normal',
  };

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-green-600',
    danger: 'text-red-600',
    warning: 'text-yellow-600',
    success: 'text-green-600',
    info: 'text-blue-500',
    gray: 'text-gray-600',
    inherit: '',
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify',
  };

  const defaultComponents = {
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
    body1: 'p',
    body2: 'p',
    caption: 'span',
    overline: 'span',
  };

  const Component = component || defaultComponents[variant];

  return React.createElement(
    Component as keyof JSX.IntrinsicElements,
    {
      className: clsx(
        variantClasses[variant],
        colorClasses[color],
        alignClasses[align],
        className
      ),
      ...props,
    },
    children
  );
};

export default Typography;