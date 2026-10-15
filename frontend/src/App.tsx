import { lazy, Suspense, useState } from 'react';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import AdminLoadingScreen from './admin/AdminLoadingScreen';
import Layout from './components/Layout';
import { isAdminPath, paths, useLocation } from './lib/router';
import ArticleDetail from './pages/ArticleDetail';
import Articles from './pages/Articles';
import Contact from './pages/Contact';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import { createPublicQueryClient } from './services/queryClient';

// Kode panel admin dipisah ke chunk sendiri: pengunjung situs publik tidak mengunduhnya.
const AdminApp = lazy(() => import('./admin/AdminApp'));

function decodeSegment(segment: string): string | null {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

function renderRoute(pathname: string) {
  if (pathname === paths.home) return <Home />;
  if (pathname === paths.portfolio) return <Articles />;
  if (pathname === paths.contact) return <Contact />;

  const articleMatch = pathname.match(/^\/portfolio\/([^/]+)$/);
  if (articleMatch) {
    const slug = decodeSegment(articleMatch[1]);
    if (slug !== null) return <ArticleDetail slug={slug} />;
  }

  return <NotFound />;
}

export default function App({ queryClient: provided }: { queryClient?: QueryClient }) {
  const { pathname } = useLocation();
  // `queryClient` hanya diisi uji (tanpa percobaan ulang); aplikasi membuat sendiri.
  const [queryClient] = useState(() => provided ?? createPublicQueryClient());

  if (isAdminPath(pathname)) {
    return (
      <Suspense fallback={<AdminLoadingScreen />}>
        <AdminApp />
      </Suspense>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Layout>{renderRoute(pathname)}</Layout>
    </QueryClientProvider>
  );
}
