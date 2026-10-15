import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { authKeys, type AdminUser } from '../auth';

export interface PasswordChange {
  current_password: string;
  password: string;
  password_confirmation: string;
}

/**
 * PUT /api/auth/password: mengganti kata sandi akun sendiri. Sesi di perangkat lain berakhir,
 * sesi ini tetap berjalan, dan penanda "wajib ganti kata sandi" dicabut. Galat 422 per kolom.
 */
export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PasswordChange) =>
      (await apiRequest<{ user: AdminUser }>('/api/auth/password', { method: 'PUT', body: input }))
        .user,
    onSuccess: (user) => queryClient.setQueryData(authKeys.me, user),
  });
}
