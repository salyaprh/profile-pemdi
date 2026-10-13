import { IconHistory } from '@tabler/icons-react';
import EmptyState from '../../components/EmptyState';
import FilterChips from '../../components/FilterChips';
import PaginationNav from '../../components/PaginationNav';
import { formatDateTime } from '../../lib/format';
import { navigate, paths, useLocation } from '../../lib/router';
import { usePageMeta } from '../../lib/seo';
import { ACTIVITY_GROUPS, useActivity, type ActivityFilter } from '../activity/api';
import LoadError from '../components/LoadError';
import { DataTable, HeaderCell } from '../components/Table';

function activityUrl(filter: ActivityFilter, page = 1): string {
  const params = new URLSearchParams();
  if (filter !== 'semua') params.set('kelompok', filter);
  if (page > 1) params.set('halaman', String(page));
  const query = params.toString();
  return query ? `${paths.adminActivity}?${query}` : paths.adminActivity;
}

/** Log aktivitas CMS (khusus Admin, hanya bisa dibaca): siapa melakukan apa, kapan, dan dari IP mana. */
export default function ActivityPage() {
  usePageMeta({ title: 'Aktivitas', noindex: true });

  const { searchParams } = useLocation();
  const group = ACTIVITY_GROUPS.find((item) => item.value === searchParams.get('kelompok'));
  const filter: ActivityFilter = group?.value ?? 'semua';
  const requestedPage = Math.floor(Number(searchParams.get('halaman')));
  const page = requestedPage > 1 ? requestedPage : 1;
  const activity = useActivity(filter, page);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-h5 font-semibold">Aktivitas</h1>
        <p className="text-caption text-content-secondary">
          Jejak semua aksi di CMS, termasuk percobaan masuk yang gagal. Catatan tidak dapat diubah
          maupun dihapus dari sini dan dihapus otomatis setelah masa simpan berakhir.
        </p>
      </div>

      <div className="rounded-xl border border-stroke-primary bg-background-primary p-4">
        <FilterChips
          label="Filter jenis aktivitas"
          options={ACTIVITY_GROUPS.map(({ value, label }) => ({ value, label }))}
          selected={filter}
          onSelect={(value) => navigate(activityUrl(value), { replace: true, scroll: false })}
        />
      </div>

      <p role="status" className="text-caption text-content-secondary">
        {activity.isPending ? 'Memuat aktivitas…' : `${activity.data?.meta.total ?? 0} catatan`}
      </p>

      {activity.isError ? (
        <LoadError
          title="Aktivitas gagal dimuat"
          message={activity.error.message}
          onRetry={() => void activity.refetch()}
        />
      ) : activity.data && activity.data.data.length === 0 ? (
        <EmptyState
          icon={<IconHistory size={32} aria-hidden="true" />}
          title="Belum ada aktivitas"
          description="Aksi di CMS yang cocok dengan filter ini akan tercatat di sini."
        />
      ) : (
        activity.data && (
          <>
            <DataTable
              label="Tabel aktivitas"
              head={
                <tr>
                  <HeaderCell>Waktu</HeaderCell>
                  <HeaderCell>Pelaku</HeaderCell>
                  <HeaderCell>Aktivitas</HeaderCell>
                  <HeaderCell>Alamat IP</HeaderCell>
                </tr>
              }
            >
              {activity.data.data.map((entry) => (
                <tr key={entry.id} className="align-top hover:bg-background-secondary">
                  <td className="whitespace-nowrap px-4 py-3 text-content-secondary">
                    <time dateTime={entry.created_at}>{formatDateTime(entry.created_at)}</time>
                  </td>
                  <td className="px-4 py-3 text-content-primary">
                    {entry.user_name ?? (
                      <span className="text-content-secondary">Tidak diketahui</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-content-primary">{entry.description}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-content-secondary">
                    {entry.ip_address ?? '–'}
                  </td>
                </tr>
              ))}
            </DataTable>
            <PaginationNav
              currentPage={activity.data.meta.current_page}
              totalPages={activity.data.meta.last_page}
              hrefFor={(target) => activityUrl(filter, target)}
            />
          </>
        )
      )}
    </div>
  );
}
