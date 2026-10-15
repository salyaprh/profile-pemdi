import ButtonLink from '../../components/ButtonLink';
import EmptyState from '../../components/EmptyState';
import { paths } from '../../lib/router';
import { usePageMeta } from '../../lib/seo';

export default function AdminNotFoundPage() {
  usePageMeta({ title: 'Halaman tidak ditemukan', noindex: true });

  return (
    <div className="space-y-6">
      <h1 className="sr-only">Halaman tidak ditemukan</h1>
      <EmptyState
        title="Halaman admin tidak ditemukan"
        description="Halaman yang Anda buka tidak ada atau belum tersedia di panel admin."
        action={<ButtonLink to={paths.admin}>Kembali ke dasbor</ButtonLink>}
      />
    </div>
  );
}
