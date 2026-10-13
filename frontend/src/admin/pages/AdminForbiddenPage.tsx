import { IconLock } from '@tabler/icons-react';
import ButtonLink from '../../components/ButtonLink';
import EmptyState from '../../components/EmptyState';
import { paths } from '../../lib/router';
import { usePageMeta } from '../../lib/seo';

/** Halaman khusus Admin yang dibuka Penulis. Backend tetap menolak permintaannya (403). */
export default function AdminForbiddenPage() {
  usePageMeta({ title: 'Khusus Admin', noindex: true });

  return (
    <div className="space-y-6">
      <h1 className="sr-only">Khusus Admin</h1>
      <EmptyState
        icon={<IconLock size={32} aria-hidden="true" />}
        title="Halaman ini khusus Admin"
        description="Akun Anda berperan sebagai Penulis. Hubungi Admin bila Anda memerlukan akses ini."
        action={<ButtonLink to={paths.admin}>Kembali ke dasbor</ButtonLink>}
      />
    </div>
  );
}
