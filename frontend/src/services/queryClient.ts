import { QueryClient, type DefaultOptions } from '@tanstack/react-query';
import { ApiError } from './api';

/** Galat 4xx tidak akan berubah bila diulang; hanya galat jaringan/server yang dicoba lagi. */
export function shouldRetry(failureCount: number, error: Error) {
  const clientError = error instanceof ApiError && error.status >= 400 && error.status < 500;
  return !clientError && failureCount < 2;
}

/** Cache data situs publik (artikel, kategori). Panel admin memakai klien sendiri. */
export function createPublicQueryClient(overrides: DefaultOptions = {}): QueryClient {
  return new QueryClient({
    defaultOptions: {
      ...overrides,
      queries: {
        retry: shouldRetry,
        // Data dianggap segar selama 1 menit: kembali ke halaman sebelumnya tidak memuat ulang.
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        ...overrides.queries,
      },
    },
  });
}
