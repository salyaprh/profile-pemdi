import { lazy, Suspense, useEffect, useState, type ReactElement } from 'react';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { navigate, paths, useLocation } from '../lib/router';
import AdminLayout from './AdminLayout';
import { useAuthenticatedUser } from './auth';
import AccountPage from './pages/AccountPage';
import ActivityPage from './pages/ActivityPage';
import AdminForbiddenPage from './pages/AdminForbiddenPage';
import AdminNotFoundPage from './pages/AdminNotFoundPage';
import ArticleListPage from './pages/ArticleListPage';
import CategoriesPage from './pages/CategoriesPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import MessageDetailPage from './pages/MessageDetailPage';
import MessagesPage from './pages/MessagesPage';
import SettingsPage from './pages/SettingsPage';
import UserFormPage from './pages/UserFormPage';
import UsersPage from './pages/UsersPage';
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

interface AdminRouteDefinition {
  /** Pola path lengkap; tangkapan pertama (bila ada) adalah id angka yang diteruskan ke `render`. */
  pattern: RegExp;
  /** Halaman khusus Admin; backend juga menolak permintaan Penulis (403). */
  adminOnly?: boolean;
  render: (id: number | null) => ReactElement;
}

const adminRoutes: AdminRouteDefinition[] = [
  { pattern: /^\/admin$/, render: () => <DashboardPage /> },
  { pattern: /^\/admin\/artikel$/, render: () => <ArticleListPage /> },
  { pattern: /^\/admin\/artikel\/baru$/, render: () => <ArticleEditor articleId={null} /> },
  { pattern: /^\/admin\/artikel\/(\d+)$/, render: (id) => <ArticleEditor articleId={id} /> },
  { pattern: /^\/admin\/akun$/, render: () => <AccountPage /> },
  { pattern: /^\/admin\/kategori$/, adminOnly: true, render: () => <CategoriesPage /> },
  { pattern: /^\/admin\/pesan$/, adminOnly: true, render: () => <MessagesPage /> },
  {
    pattern: /^\/admin\/pesan\/(\d+)$/,
    adminOnly: true,
    // key: berpindah antarpesan memasang ulang halaman (penandaan "dibaca" per pesan).
    render: (id) => <MessageDetailPage key={id} messageId={id ?? 0} />,
  },
  { pattern: /^\/admin\/pengguna$/, adminOnly: true, render: () => <UsersPage /> },
  {
    pattern: /^\/admin\/pengguna\/baru$/,
    adminOnly: true,
    render: () => <UserFormPage userId={null} />,
  },
  {
    pattern: /^\/admin\/pengguna\/(\d+)$/,
    adminOnly: true,
    render: (id) => <UserFormPage key={id} userId={id} />,
  },
  { pattern: /^\/admin\/pengaturan$/, adminOnly: true, render: () => <SettingsPage /> },
  { pattern: /^\/admin\/aktivitas$/, adminOnly: true, render: () => <ActivityPage /> },
];

function ArticleEditor({ articleId }: { articleId: number | null }) {
  return (
    <Suspense fallback={<EditorLoading />}>
      <ArticleEditorPage articleId={articleId} />
    </Suspense>
  );
}

function AdminRoute({ pathname }: { pathname: string }) {
  const user = useAuthenticatedUser();
  // Akun dengan kata sandi sementara hanya boleh membuka halaman Akun saya (backend juga menolak
  // endpoint lain dengan 403).
  const mustChangePassword = user.must_change_password && pathname !== paths.adminAccount;

  useEffect(() => {
    if (mustChangePassword) navigate(paths.adminAccount, { replace: true, force: true });
  }, [mustChangePassword]);

  if (mustChangePassword) return null;

  for (const route of adminRoutes) {
    const match = pathname.match(route.pattern);
    if (!match) continue;
    if (route.adminOnly && user.role !== 'admin') return <AdminForbiddenPage />;
    return route.render(match[1] === undefined ? null : Number(match[1]));
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
