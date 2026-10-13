import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { contentKeys, type SiteSettings } from '../../services/content';

/** Pengaturan situs (khusus Admin). Bentuk datanya sama dengan GET /api/site yang dibaca situs publik. */
export const settingsKeys = { all: ['admin', 'settings'] as const };

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: async ({ signal }) =>
      (await apiRequest<{ data: SiteSettings }>('/api/admin/settings', { signal })).data,
  });
}

export function useSaveSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SiteSettings) =>
      (
        await apiRequest<{ data: SiteSettings }>('/api/admin/settings', {
          method: 'PUT',
          body: input,
        })
      ).data,
    onSuccess: (saved) => {
      queryClient.setQueryData(settingsKeys.all, saved);
      void queryClient.invalidateQueries({ queryKey: contentKeys.site });
    },
  });
}
