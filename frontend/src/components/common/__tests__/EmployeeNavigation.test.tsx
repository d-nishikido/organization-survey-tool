import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { EmployeeNavigation } from '../EmployeeNavigation';
import { AuthContext } from '@/contexts/AuthContext';

const renderWithRouter = (component: React.ReactElement, user: any = null) => {
  const mockAuthValue = {
    user,
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

// Mock useLocation to control current path
const mockLocation = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => mockLocation(),
  };
});

describe('EmployeeNavigation', () => {
  beforeEach(() => {
    mockLocation.mockReturnValue({ pathname: '/' });
  });

  it('should render navigation items for anonymous users', () => {
    renderWithRouter(<EmployeeNavigation />);

    expect(screen.getByText('ホーム')).toBeInTheDocument();
    expect(screen.getByText('調査一覧')).toBeInTheDocument();
    // Dashboard should not be visible for anonymous users
    expect(screen.queryByText('ダッシュボード')).not.toBeInTheDocument();
  });

  it('should render all navigation items for authenticated users', () => {
    const mockUser = { id: 1, email: 'test@example.com', role: 'employee' };
    renderWithRouter(<EmployeeNavigation />, mockUser);

    expect(screen.getByText('ホーム')).toBeInTheDocument();
    expect(screen.getByText('調査一覧')).toBeInTheDocument();
    expect(screen.getByText('ダッシュボード')).toBeInTheDocument();
  });

  it('should highlight active navigation item - home', () => {
    mockLocation.mockReturnValue({ pathname: '/' });
    renderWithRouter(<EmployeeNavigation />);

    const homeLink = screen.getByText('ホーム').closest('a');
    expect(homeLink).toHaveClass('border-blue-500', 'text-blue-600');
    expect(homeLink).toHaveAttribute('aria-current', 'page');
  });

  it('should highlight active navigation item - surveys', () => {
    mockLocation.mockReturnValue({ pathname: '/surveys' });
    renderWithRouter(<EmployeeNavigation />);

    const surveysLink = screen.getByText('調査一覧').closest('a');
    expect(surveysLink).toHaveClass('border-blue-500', 'text-blue-600');
    expect(surveysLink).toHaveAttribute('aria-current', 'page');
  });

  it('should highlight active navigation item - dashboard', () => {
    mockLocation.mockReturnValue({ pathname: '/dashboard' });
    const mockUser = { id: 1, email: 'test@example.com', role: 'employee' };
    renderWithRouter(<EmployeeNavigation />, mockUser);

    const dashboardLink = screen.getByText('ダッシュボード').closest('a');
    expect(dashboardLink).toHaveClass('border-blue-500', 'text-blue-600');
    expect(dashboardLink).toHaveAttribute('aria-current', 'page');
  });

  it('should render navigation items with correct href attributes', () => {
    const mockUser = { id: 1, email: 'test@example.com', role: 'employee' };
    renderWithRouter(<EmployeeNavigation />, mockUser);

    const homeLink = screen.getByText('ホーム').closest('a');
    const surveysLink = screen.getByText('調査一覧').closest('a');
    const dashboardLink = screen.getByText('ダッシュボード').closest('a');

    expect(homeLink).toHaveAttribute('href', '/');
    expect(surveysLink).toHaveAttribute('href', '/surveys');
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
  });

  it('should render navigation items with icons', () => {
    renderWithRouter(<EmployeeNavigation />);

    // Check that SVG icons are present for each visible navigation item
    const homeLink = screen.getByText('ホーム').closest('a');
    const surveysLink = screen.getByText('調査一覧').closest('a');

    expect(homeLink?.querySelector('svg')).toBeInTheDocument();
    expect(surveysLink?.querySelector('svg')).toBeInTheDocument();
  });

  it('should apply inactive styles to non-active items', () => {
    mockLocation.mockReturnValue({ pathname: '/' });
    renderWithRouter(<EmployeeNavigation />);

    const surveysLink = screen.getByText('調査一覧').closest('a');
    expect(surveysLink).toHaveClass('border-transparent', 'text-gray-500');
    expect(surveysLink).not.toHaveAttribute('aria-current');
  });
});