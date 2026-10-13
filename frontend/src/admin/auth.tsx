import { createContext, useContext, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../services/api';

export type AdminRole = 'admin' | 'penulis';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  role_label: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export const authKeys = {
  me: ['auth', 'me'] as const,
};

/** Pengguna yang sedang login, atau null bila belum login. */
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: async ({ signal }) =>
      (await apiRequest<{ user: AdminUser | null }>('/api/auth/me', { signal })).user,
    staleTime: 60_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: LoginCredentials) =>
      (
        await apiRequest<{ user: AdminUser }>('/api/auth/login', {
          method: 'POST',
          body: credentials,
        })
      ).user,
    onSuccess: (user) => queryClient.setQueryData(authKeys.me, user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiRequest<void>('/api/auth/logout', { method: 'POST' }),
    // Data admin milik sesi ini tidak boleh tersisa di cache setelah keluar, apa pun hasilnya.
    onSettled: () => {
      queryClient.clear();
      queryClient.setQueryData(authKeys.me, null);
    },
  });
}

const AuthenticatedUserContext = createContext<AdminUser | null>(null);

export function AuthenticatedUserProvider({
  user,
  children,
}: {
  user: AdminUser;
  children: ReactNode;
}) {
  return (
    <AuthenticatedUserContext.Provider value={user}>{children}</AuthenticatedUserContext.Provider>
  );
}

/** Pengguna login di dalam area yang dijaga `RequireAuth`. */
export function useAuthenticatedUser(): AdminUser {
  const user = useContext(AuthenticatedUserContext);
  if (!user) throw new Error('useAuthenticatedUser dipakai di luar RequireAuth');
  return user;
}
