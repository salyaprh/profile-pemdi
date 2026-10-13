import { useEffect, type ReactNode } from 'react';
import { Alert, Button } from '@idds/react';
import { navigate, paths, useLocation } from '../lib/router';
import AdminLoadingScreen from './AdminLoadingScreen';
import { AuthenticatedUserProvider, useCurrentUser } from './auth';

/**
 * Penjaga halaman admin: tamu diarahkan ke halaman Masuk dengan ?kembali= agar setelah login
 * kembali ke halaman yang tadi dibuka. Ini hanya untuk tampilan; batas keamanan sebenarnya ada
 * di backend (setiap endpoint admin memeriksa sesi dan hak akses).
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { data: user, isPending, isError, error, refetch, isRefetching } = useCurrentUser();
  const { pathname, search } = useLocation();
  const isGuest = !isPending && !isError && !user;

  useEffect(() => {
    if (!isGuest) return;
    const returnTo = encodeURIComponent(pathname + search);
    navigate(`${paths.adminLogin}?kembali=${returnTo}`, { replace: true });
  }, [isGuest, pathname, search]);

  if (isPending) return <AdminLoadingScreen />;

  if (isError && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-secondary p-4">
        <div className="w-full max-w-md space-y-4">
          <Alert
            variant="critical"
            title="Panel admin tidak dapat dimuat"
            message={error.message}
          />
          <Button
            hierarchy="secondary"
            onClick={() => void refetch()}
            disabled={isRefetching}
            className="w-full"
          >
            {isRefetching ? 'Mencoba lagi…' : 'Coba lagi'}
          </Button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <AuthenticatedUserProvider user={user}>{children}</AuthenticatedUserProvider>;
}
