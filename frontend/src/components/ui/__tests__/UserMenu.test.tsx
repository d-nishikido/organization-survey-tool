import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { UserMenu } from '../UserMenu';
import { useAuth } from '@/contexts/AuthContext';

// Mock the useAuth hook
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('UserMenu', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockUseAuth.mockClear();
  });

  it('should not render when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      sessionId: null,
      login: jest.fn(),
      logout: jest.fn(),
      createAnonymousSession: jest.fn(),
      hasRole: jest.fn(),
      hasAnyRole: jest.fn(),
    });

    renderWithRouter(<UserMenu />);
    
    // The component should not render anything
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should render user menu when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'employee' },
      isAuthenticated: true,
      isLoading: false,
      sessionId: null,
      login: jest.fn(),
      logout: jest.fn(),
      createAnonymousSession: jest.fn(),
      hasRole: jest.fn(),
      hasAnyRole: jest.fn(),
    });

    renderWithRouter(<UserMenu />);
    
    // Should render the user menu button
    expect(screen.getByRole('button', { name: /ユーザーメニュー/i })).toBeInTheDocument();
    expect(screen.getByText('T')).toBeInTheDocument(); // First letter of name
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('should show dropdown menu when clicked', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'employee' },
      isAuthenticated: true,
      isLoading: false,
      sessionId: null,
      login: jest.fn(),
      logout: jest.fn(),
      createAnonymousSession: jest.fn(),
      hasRole: jest.fn(),
      hasAnyRole: jest.fn(),
    });

    renderWithRouter(<UserMenu />);
    
    // Click the user menu button
    fireEvent.click(screen.getByRole('button', { name: /ユーザーメニュー/i }));
    
    // Should show the dropdown menu
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /ログアウト/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /ダッシュボード/i })).toBeInTheDocument();
  });

  it('should call logout and navigate when logout is clicked', () => {
    const mockLogout = jest.fn();
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'employee' },
      isAuthenticated: true,
      isLoading: false,
      sessionId: null,
      login: jest.fn(),
      logout: mockLogout,
      createAnonymousSession: jest.fn(),
      hasRole: jest.fn(),
      hasAnyRole: jest.fn(),
    });

    renderWithRouter(<UserMenu />);
    
    // Open the menu and click logout
    fireEvent.click(screen.getByRole('button', { name: /ユーザーメニュー/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /ログアウト/i }));
    
    // Should call logout function and navigate to login
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should show admin menu item for HR/admin users', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'hr' },
      isAuthenticated: true,
      isLoading: false,
      sessionId: null,
      login: jest.fn(),
      logout: jest.fn(),
      createAnonymousSession: jest.fn(),
      hasRole: jest.fn(),
      hasAnyRole: jest.fn(),
    });

    renderWithRouter(<UserMenu />);
    
    // Open the menu
    fireEvent.click(screen.getByRole('button', { name: /ユーザーメニュー/i }));
    
    // Should show admin menu item
    expect(screen.getByRole('menuitem', { name: /管理画面/i })).toBeInTheDocument();
  });
});