import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../LoginPage';
import { UserRole } from '@/types/auth';

// Mock the useAuth hook
const mockLogin = vi.fn();
const mockUseAuth = vi.fn(() => ({
  isAuthenticated: false,
  login: mockLogin,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('LoginPage', () => {
  it('renders demo login buttons', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    expect(screen.getByText('HR Manager')).toBeInTheDocument();
    expect(screen.getByText('System Admin')).toBeInTheDocument();
    expect(screen.getByText('Employee')).toBeInTheDocument();
  });

  it('calls login with correct HR user data when HR button clicked', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const hrButton = screen.getByRole('button', { name: /HR Manager/i });
    fireEvent.click(hrButton);

    expect(mockLogin).toHaveBeenCalledWith({
      id: 'demo-hr',
      email: 'hr@example.com',
      name: 'HR Manager',
      role: 'hr' as UserRole,
      department: '人事部'
    });
  });

  it('calls login with correct Admin user data when Admin button clicked', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const adminButton = screen.getByRole('button', { name: /System Admin/i });
    fireEvent.click(adminButton);

    expect(mockLogin).toHaveBeenCalledWith({
      id: 'demo-admin',
      email: 'admin@example.com',
      name: 'System Admin',
      role: 'admin' as UserRole,
      department: 'IT部'
    });
  });

  it('calls login with correct Employee user data when Employee button clicked', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const employeeButton = screen.getByRole('button', { name: /Employee/i });
    fireEvent.click(employeeButton);

    expect(mockLogin).toHaveBeenCalledWith({
      id: 'demo-emp',
      email: 'employee@example.com',
      name: 'Employee User',
      role: 'employee' as UserRole,
      department: '営業部'
    });
  });

  it('displays development environment notice', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/この機能は開発環境専用です/)).toBeInTheDocument();
  });
});