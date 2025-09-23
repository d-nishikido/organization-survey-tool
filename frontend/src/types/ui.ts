import { ReactNode, HTMLAttributes, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

// Base types
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type Variant = 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'info' | 'ghost' | 'outline';
export type Color = 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'info' | 'gray';

// Button types
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  isFullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

// Input types
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  isRequired?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

// Card types
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: Size;
  children: ReactNode;
}

// Modal types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: Size;
  children: ReactNode;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

// Alert types
export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  icon?: ReactNode;
}

// Loading types
export interface LoadingProps {
  size?: Size;
  color?: Color;
  text?: string;
}

// Typography types
export interface TypographyProps extends HTMLAttributes<HTMLElement> {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption' | 'overline';
  color?: Color | 'inherit';
  align?: 'left' | 'center' | 'right' | 'justify';
  component?: keyof JSX.IntrinsicElements;
  children: ReactNode;
}

// Layout types
export interface LayoutProps {
  children: ReactNode;
  header?: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

// Navigation types
export interface NavigationItem {
  label: string;
  href: string;
  icon?: ReactNode;
  isActive?: boolean;
  children?: NavigationItem[];
}

export interface NavigationProps {
  items: NavigationItem[];
  variant?: 'horizontal' | 'vertical' | 'mobile';
  className?: string;
}

// Form types
export interface FormFieldProps {
  label?: string;
  error?: string;
  helperText?: string;
  isRequired?: boolean;
  children: ReactNode;
  className?: string;
}

export interface ValidationMessageProps {
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  className?: string;
}

// Progress types
export interface ProgressBarProps {
  value: number;
  max?: number;
  size?: Size;
  color?: Color;
  showLabel?: boolean;
  label?: string;
  className?: string;
}

// Theme types
export interface ThemeColors {
  primary: string;
  secondary: string;
  danger: string;
  warning: string;
  success: string;
  info: string;
  gray: Record<string, string>;
}

export interface Theme {
  colors: ThemeColors;
  spacing: Record<string, string>;
  typography: {
    fontFamily: Record<string, string>;
    fontSize: Record<string, string>;
    fontWeight: Record<string, number>;
    lineHeight: Record<string, number>;
  };
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
  zIndex: Record<string, number>;
}