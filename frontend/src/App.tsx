import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute, HRRoute } from '@components/auth/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { SurveyListPage } from './pages/SurveyListPage';
import { SurveyDetailPage } from './pages/SurveyDetailPage';
import { SurveyPage } from './pages/SurveyPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { SurveyManagement } from './pages/SurveyManagement';
import { SurveyOperations } from './pages/SurveyOperations';
import { SurveyForm } from './components/admin/SurveyForm';
import { SurveyPreview } from './components/admin/SurveyPreview';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export function App(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              
              {/* Survey Routes (Anonymous Access) */}
              <Route path="/surveys" element={<SurveyListPage />} />
              <Route path="/survey/:surveyId/details" element={<SurveyDetailPage />} />
              <Route path="/survey/:surveyId" element={<SurveyPage />} />
              
              {/* Protected Routes - Authenticated Users */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <div className="p-8">
                      <h1 className="text-2xl font-bold">ダッシュボード</h1>
                      <p>認証ユーザー専用ページ（開発中）</p>
                    </div>
                  </ProtectedRoute>
                } 
              />
              
              {/* HR Routes */}
              <Route
                path="/admin"
                element={
                  <HRRoute>
                    <AdminDashboard />
                  </HRRoute>
                }
              />
              <Route
                path="/admin/surveys"
                element={
                  <HRRoute>
                    <SurveyManagement />
                  </HRRoute>
                }
              />
              <Route
                path="/admin/surveys/new"
                element={
                  <HRRoute>
                    <SurveyForm />
                  </HRRoute>
                }
              />
              <Route
                path="/admin/surveys/:id/edit"
                element={
                  <HRRoute>
                    <SurveyForm />
                  </HRRoute>
                }
              />
              <Route
                path="/admin/surveys/:id/preview"
                element={
                  <HRRoute>
                    <SurveyPreview />
                  </HRRoute>
                }
              />
              <Route
                path="/admin/surveys/:id/operations"
                element={
                  <HRRoute>
                    <SurveyOperations />
                  </HRRoute>
                }
              />
              <Route
                path="/admin/*"
                element={
                  <HRRoute>
                    <AdminDashboard />
                  </HRRoute>
                }
              />
              
              {/* Results Routes */}
              <Route 
                path="/results/:surveyId" 
                element={
                  <div className="p-8">
                    <h1 className="text-2xl font-bold">調査結果</h1>
                    <p>結果表示ページ（開発中）</p>
                  </div>
                } 
              />
              
              {/* Catch-all Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}