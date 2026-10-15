import { lazy, Suspense } from 'react';
import AdminLoadingScreen from './admin/AdminLoadingScreen';
import Layout from './components/Layout';
import { isAdminPath, paths, useLocation } from './lib/router';
import ArticleDetail from './pages/ArticleDetail';
import Articles from './pages/Articles';
import Contact from './pages/Contact';
import Home from './pages/Home';
import NotFound from './pages/NotFound';

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
    const articleId = decodeSegment(articleMatch[1]);
    if (articleId !== null) return <ArticleDetail articleId={articleId} />;
  }

  return <NotFound />;
}

export default function App() {
  const { pathname } = useLocation();

  if (isAdminPath(pathname)) {
    return (
      <Suspense fallback={<AdminLoadingScreen />}>
        <AdminApp />
      </Suspense>
    );
  }

  return <Layout>{renderRoute(pathname)}</Layout>;
}
