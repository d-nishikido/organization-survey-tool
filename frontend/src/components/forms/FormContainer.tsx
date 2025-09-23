import React from 'react';
import { clsx } from 'clsx';
import { Card } from '../ui';

interface FormContainerProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  className?: string;
  actions?: React.ReactNode;
  isLoading?: boolean;
}

const FormContainer: React.FC<FormContainerProps> = ({
  title,
  description,
  children,
  onSubmit,
  className,
  actions,
  isLoading = false,
}) => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isLoading) {
      onSubmit?.(event);
    }
  };

  return (
    <Card className={clsx('max-w-2xl mx-auto', className)}>
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-gray-600">
              {description}
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset disabled={isLoading} className="space-y-6">
          {children}
        </fieldset>

        {actions && (
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-6 border-t border-gray-200">
            {actions}
          </div>
        )}
      </form>
    </Card>
  );
};

export default FormContainer;