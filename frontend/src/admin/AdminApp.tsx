import { useState } from 'react';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { paths, useLocation } from '../lib/router';
import AdminLayout from './AdminLayout';
import DashboardPage from './pages/DashboardPage';
import AdminNotFoundPage from './pages/AdminNotFoundPage';
import LoginPage from './pages/LoginPage';
import { createAdminQueryClient } from './queryClient';
import RequireAuth from './RequireAuth';

function renderAdminRoute(pathname: string) {
  if (pathname === paths.admin) return <DashboardPage />;
  return <AdminNotFoundPage />;
}

function AdminRoutes() {
  const { pathname } = useLocation();

  if (pathname === paths.adminLogin) return <LoginPage />;

  return (
    <RequireAuth>
      <AdminLayout>{renderAdminRoute(pathname)}</AdminLayout>
    </RequireAuth>
  );
}

/**
 * Panel admin CMS (/admin/*). Dimuat terpisah (React.lazy di App.tsx) sehingga pengunjung situs
 * publik tidak mengunduh kode admin.
 */
export default function AdminApp({ queryClient: provided }: { queryClient?: QueryClient }) {
  // `queryClient` hanya diisi uji (mis. tanpa jeda percobaan ulang); aplikasi membuat sendiri.
  const [queryClient] = useState(() => provided ?? createAdminQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AdminRoutes />
    </QueryClientProvider>
  );
}
