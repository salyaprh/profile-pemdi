import { MutationCache, QueryCache, QueryClient, type DefaultOptions } from '@tanstack/react-query';
import { ApiError } from '../services/api';
import { shouldRetry } from '../services/queryClient';
import { authKeys } from './auth';

export function createAdminQueryClient(overrides: DefaultOptions = {}): QueryClient {
  // 401 = sesi sudah tidak berlaku (habis karena tidak aktif, keluar di tab lain, atau akun
  // dinonaktifkan Admin). Tandai "belum login" agar RequireAuth mengarahkan ke halaman Masuk.
  const onError = (error: Error) => {
    if (error instanceof ApiError && error.status === 401) client.setQueryData(authKeys.me, null);
  };

  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: {
      ...overrides,
      queries: { retry: shouldRetry, ...overrides.queries },
      mutations: { retry: false, ...overrides.mutations },
    },
  });

  return client;
}
