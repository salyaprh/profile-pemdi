import { useEffect, useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Articles from './pages/Articles';
import FormSubmission from './pages/FormSubmission';

type Page = 'dashboard' | 'articles' | 'form';

const pagePaths: Record<Page, string> = {
  dashboard: '/',
  articles: '/portfolio',
  form: '/contact',
};

function getPageFromPath(pathname: string): Page {
  const normalizedPath = pathname.replace(/\/$/, '') || '/';

  switch (normalizedPath) {
    case '/portfolio':
      return 'articles';
    case '/contact':
      return 'form';
    default:
      return 'dashboard';
  }
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>(() =>
    getPageFromPath(window.location.pathname),
  );

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(getPageFromPath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToPage = (page: string) => {
    if (!Object.hasOwn(pagePaths, page)) return;

    const nextPage = page as Page;
    const nextPath = pagePaths[nextPage];

    if (window.location.pathname !== nextPath) {
      window.history.pushState({ page: nextPage }, '', nextPath);
    }

    setCurrentPage(nextPage);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={navigateToPage} />;
      case 'articles':
        return <Articles />;
      case 'form':
        return <FormSubmission />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={navigateToPage}>
      {renderPage()}
    </Layout>
  );
}

export default App;
