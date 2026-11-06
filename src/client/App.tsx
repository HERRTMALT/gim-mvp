import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './lib/auth';
import { AppLayout } from './components/AppLayout';
import { SplashScreen } from './components/ui';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { MemberDetailPage } from './pages/MemberDetailPage';
import { MemberFormPage } from './pages/MemberFormPage';
import { MembersPage } from './pages/MembersPage';
import { PlansPage } from './pages/PlansPage';
import { RoutineEditorPage } from './pages/RoutineEditorPage';
import { RoutineViewPage } from './pages/RoutineViewPage';
import { RoutineWizardPage } from './pages/RoutineWizardPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoutes() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <SplashScreen />;
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoutes />}>
              <Route element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="socios" element={<MembersPage />} />
                <Route path="socios/nuevo" element={<MemberFormPage />} />
                <Route path="socios/:id" element={<MemberDetailPage />} />
                <Route path="socios/:id/editar" element={<MemberFormPage />} />
                <Route path="socios/:id/rutina/nueva" element={<RoutineWizardPage />} />
                <Route path="rutinas/:id" element={<RoutineViewPage />} />
                <Route path="rutinas/:id/editar" element={<RoutineEditorPage />} />
                <Route path="planes" element={<PlansPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{ duration: 4000 }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
