import { Skeleton } from '@idds/react';
import {
  IconCircleCheck,
  IconClockHour4,
  IconMail,
  IconPencil,
  type Icon,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import ButtonLink from '../../components/ButtonLink';
import { formatDateTime } from '../../lib/format';
import { Link, paths } from '../../lib/router';
import { usePageMeta } from '../../lib/seo';
import { apiRequest } from '../../services/api';
import { useAuthenticatedUser } from '../auth';
import LoadError from '../components/LoadError';

interface ActivityItem {
  id: number;
  action: string;
  description: string;
  user_name: string | null;
  created_at: string;
}

export interface DashboardData {
  metrics: { published: number; in_review: number; draft: number };
  /** Khusus Admin: jumlah pesan kontak yang belum dibaca. */
  unread_messages?: number;
  recent_activity: ActivityItem[];
}

const metricCards: { key: keyof DashboardData['metrics']; label: string; icon: Icon }[] = [
  { key: 'published', label: 'Terbit', icon: IconCircleCheck },
  { key: 'in_review', label: 'Menunggu tinjauan', icon: IconClockHour4 },
  { key: 'draft', label: 'Draf', icon: IconPencil },
];

/**
 * Pola Dashboard IDDS ("CMS Dashboard"): metrik prioritas di atas sebagai kartu ringkas,
 * detail pendukung (aktivitas terbaru) di bawahnya.
 */
export default function DashboardPage() {
  usePageMeta({ title: 'Dasbor', noindex: true });

  const user = useAuthenticatedUser();
  const isAdmin = user.role === 'admin';
  const dashboard = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: ({ signal }) => apiRequest<DashboardData>('/api/admin/dashboard', { signal }),
  });

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-h5 font-semibold">Dasbor</h1>
        <p className="text-caption text-content-secondary">
          Halo, {user.name}.{' '}
          {isAdmin
            ? 'Berikut ringkasan seluruh artikel di situs.'
            : 'Berikut ringkasan artikel Anda.'}
        </p>
      </div>

      {dashboard.isError ? (
        <LoadError
          title="Ringkasan gagal dimuat"
          message={dashboard.error.message}
          onRetry={() => void dashboard.refetch()}
        />
      ) : (
        <>
          <section aria-labelledby="judul-ringkasan">
            <h2 id="judul-ringkasan" className="sr-only">
              Ringkasan artikel
            </h2>
            <dl className="grid gap-4 sm:grid-cols-3">
              {metricCards.map(({ key, label, icon: CardIcon }) => (
                <div
                  key={key}
                  className="rounded-xl border border-stroke-primary bg-background-primary p-5"
                >
                  <dt className="flex items-center gap-2 text-caption text-content-secondary">
                    <CardIcon size={18} aria-hidden="true" />
                    {label}
                  </dt>
                  <dd className="mt-2 text-h3 font-semibold">
                    {dashboard.data ? (
                      dashboard.data.metrics[key]
                    ) : (
                      <>
                        <Skeleton width="3rem" height="2.5rem" rounded="md" />
                        <span className="sr-only">Memuat</span>
                      </>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {isAdmin && dashboard.data?.unread_messages !== undefined && (
            <section
              aria-labelledby="judul-pesan"
              className="flex flex-col gap-3 rounded-xl border border-stroke-primary bg-background-primary p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <IconMail size={22} aria-hidden="true" className="text-primary-600" />
                <div>
                  <h2 id="judul-pesan" className="text-body-sm font-semibold">
                    Pesan masuk
                  </h2>
                  <p className="text-caption text-content-secondary">
                    {dashboard.data.unread_messages > 0
                      ? `${dashboard.data.unread_messages} pesan belum dibaca`
                      : 'Tidak ada pesan yang belum dibaca'}
                  </p>
                </div>
              </div>
              <ButtonLink
                to={
                  dashboard.data.unread_messages > 0
                    ? `${paths.adminMessages}?status=belum-dibaca`
                    : paths.adminMessages
                }
                hierarchy="secondary"
              >
                Buka pesan masuk
              </ButtonLink>
            </section>
          )}

          {isAdmin && (
            <section
              aria-labelledby="judul-aktivitas"
              className="rounded-xl border border-stroke-primary bg-background-primary"
            >
              <div className="flex items-center justify-between gap-3 border-b border-stroke-primary px-5 py-4">
                <h2 id="judul-aktivitas" className="text-body-sm font-semibold">
                  Aktivitas terbaru
                </h2>
                <Link
                  to={paths.adminActivity}
                  className="rounded text-caption font-medium text-primary-600 hover:underline"
                >
                  Lihat semua
                </Link>
              </div>
              {!dashboard.data ? (
                <div className="space-y-3 p-5">
                  <Skeleton height="1.25rem" />
                  <Skeleton height="1.25rem" />
                  <span className="sr-only">Memuat aktivitas</span>
                </div>
              ) : dashboard.data.recent_activity.length === 0 ? (
                <p className="px-5 py-6 text-caption text-content-secondary">
                  Belum ada aktivitas.
                </p>
              ) : (
                <ul className="divide-y divide-stroke-primary">
                  {dashboard.data.recent_activity.map((activity) => (
                    <li
                      key={activity.id}
                      className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="text-caption">
                        <span className="font-semibold">{activity.user_name ?? 'Sistem'}</span>{' '}
                        <span className="text-content-secondary">— {activity.description}</span>
                      </span>
                      <time
                        dateTime={activity.created_at}
                        className="shrink-0 text-caption-sm text-content-secondary"
                      >
                        {formatDateTime(activity.created_at)}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
