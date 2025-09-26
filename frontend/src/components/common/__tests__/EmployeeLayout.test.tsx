import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { EmployeeLayout } from '../EmployeeLayout';
import { AuthContext } from '@/contexts/AuthContext';

// Mock the UserMenu component
vi.mock('@/components/ui/UserMenu', () => ({
  UserMenu: () => <div data-testid="user-menu">User Menu</div>,
}));

// Mock the EmployeeNavigation component
vi.mock('../EmployeeNavigation', () => ({
  EmployeeNavigation: () => <div data-testid="employee-navigation">Employee Navigation</div>,
}));

const renderWithRouter = (component: React.ReactElement) => {
  const mockAuthValue = {
    user: null,
    sessionId: 'test-session-id',
    login: vi.fn(),
    logout: vi.fn(),
    isLoading: false,
    error: null,
  };

  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthValue}>
        {component}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('EmployeeLayout', () => {
  it('should render with default props', () => {
    renderWithRouter(
      <EmployeeLayout>
        <div>Test Content</div>
      </EmployeeLayout>
    );

    expect(screen.getByText('Organization Survey Tool')).toBeInTheDocument();
    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    expect(screen.getByTestId('employee-navigation')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    renderWithRouter(
      <EmployeeLayout title="Custom Title">
        <div>Test Content</div>
      </EmployeeLayout>
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.queryByText('Organization Survey Tool')).not.toBeInTheDocument();
  });

  it('should hide navigation when showNavigation is false', () => {
    renderWithRouter(
      <EmployeeLayout showNavigation={false}>
        <div>Test Content</div>
      </EmployeeLayout>
    );

    expect(screen.queryByTestId('employee-navigation')).not.toBeInTheDocument();
    expect(screen.getByText('Organization Survey Tool')).toBeInTheDocument();
    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
  });

  it('should render header with logo and user menu', () => {
    renderWithRouter(
      <EmployeeLayout>
        <div>Test Content</div>
      </EmployeeLayout>
    );

    // Check for header structure
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('bg-white', 'shadow-sm', 'border-b', 'border-gray-200');

    // Check for logo (SVG)
    const logo = header.querySelector('svg');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveClass('w-8', 'h-8', 'text-blue-600');
  });

  it('should render main content area', () => {
    renderWithRouter(
      <EmployeeLayout>
        <div data-testid="main-content">Main Content</div>
      </EmployeeLayout>
    );

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
  });
});