import { lazy, Suspense, useState } from 'react';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { paths, useLocation } from '../lib/router';
import AdminLayout from './AdminLayout';
import { useAuthenticatedUser } from './auth';
import AdminForbiddenPage from './pages/AdminForbiddenPage';
import AdminNotFoundPage from './pages/AdminNotFoundPage';
import ArticleListPage from './pages/ArticleListPage';
import CategoriesPage from './pages/CategoriesPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import { createAdminQueryClient } from './queryClient';
import RequireAuth from './RequireAuth';

// Editor (TipTap + ProseMirror) adalah bagian terbesar panel admin; dimuat hanya saat dibuka.
const ArticleEditorPage = lazy(() => import('./pages/ArticleEditorPage'));

function EditorLoading() {
  return (
    <p role="status" className="text-caption text-content-secondary">
      Memuat editor…
    </p>
  );
}

function AdminRoute({ pathname }: { pathname: string }) {
  const user = useAuthenticatedUser();

  if (pathname === paths.admin) return <DashboardPage />;
  if (pathname === paths.adminArticles) return <ArticleListPage />;

  const articleMatch = pathname.match(/^\/admin\/artikel\/(\d+)$/);
  if (pathname === paths.adminArticleNew || articleMatch) {
    return (
      <Suspense fallback={<EditorLoading />}>
        <ArticleEditorPage articleId={articleMatch ? Number(articleMatch[1]) : null} />
      </Suspense>
    );
  }

  if (pathname === paths.adminCategories) {
    return user.role === 'admin' ? <CategoriesPage /> : <AdminForbiddenPage />;
  }

  return <AdminNotFoundPage />;
}

function AdminRoutes() {
  const { pathname } = useLocation();

  if (pathname === paths.adminLogin) return <LoginPage />;

  return (
    <RequireAuth>
      <AdminLayout>
        <AdminRoute pathname={pathname} />
      </AdminLayout>
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
