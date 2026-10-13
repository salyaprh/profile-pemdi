import { useEffect, useRef, useState } from 'react';
import { Alert, Button, useToast } from '@idds/react';
import { IconArrowLeft, IconMailForward } from '@tabler/icons-react';
import ButtonLink from '../../components/ButtonLink';
import EmptyState from '../../components/EmptyState';
import { formatDateTime } from '../../lib/format';
import { Link, navigate, paths } from '../../lib/router';
import { usePageMeta } from '../../lib/seo';
import { ApiError } from '../../services/api';
import ConfirmDialog from '../components/ConfirmDialog';
import { useDeleteMessage, useMarkMessage, useMessage } from '../messages/api';
import LoadError from '../components/LoadError';

/**
 * Alamat email pengirim berasal dari pengunjung dan lolos validasi yang longgar, jadi selalu
 * di-encode: tanpa itu "x@y.zz?bcc=..." akan menambah header ke surel yang dibuka Admin.
 */
const mailto = (email: string, subject?: string) =>
  `mailto:${encodeURIComponent(email)}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;

/** Detail satu pesan; ditandai sudah dibaca saat dibuka. */
export default function MessageDetailPage({ messageId }: { messageId: number }) {
  usePageMeta({ title: 'Pesan masuk', noindex: true });

  const { toast } = useToast();
  const message = useMessage(messageId);
  const mark = useMarkMessage(messageId);
  const remove = useDeleteMessage(messageId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pesan yang belum dibaca ditandai dibaca saat pertama kali tampil. Keputusan ini diambil sekali
  // saja, agar "Tandai belum dibaca" tidak langsung dibatalkan oleh penandaan otomatis.
  const autoMarkDecided = useRef(false);
  const data = message.data;
  useEffect(() => {
    if (!data || autoMarkDecided.current) return;
    autoMarkDecided.current = true;
    if (data.read_at === null) mark.mutate(true);
  }, [data, mark]);

  if (message.isPending) {
    return (
      <p role="status" className="text-caption text-content-secondary">
        Memuat pesan…
      </p>
    );
  }

  if (message.isError) {
    const notFound = message.error instanceof ApiError && message.error.status === 404;
    return notFound ? (
      <EmptyState
        title="Pesan tidak ditemukan"
        description="Pesan ini mungkin sudah dihapus atau melewati masa simpan 12 bulan."
        action={<ButtonLink to={paths.adminMessages}>Kembali ke pesan masuk</ButtonLink>}
      />
    ) : (
      <LoadError
        title="Pesan gagal dimuat"
        message={message.error.message}
        onRetry={() => void message.refetch()}
      />
    );
  }

  const item = message.data;

  const toggleRead = async () => {
    setError(null);
    try {
      const updated = await mark.mutateAsync(item.read_at === null);
      toast({
        title: updated.read_at ? 'Ditandai sudah dibaca' : 'Ditandai belum dibaca',
        state: 'positive',
        duration: 4000,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Terjadi kesalahan.');
    }
  };

  const handleDelete = async () => {
    try {
      await remove.mutateAsync();
      setConfirmDelete(false);
      toast({ title: 'Pesan dihapus', state: 'positive', duration: 4000 });
      navigate(paths.adminMessages);
    } catch (caught) {
      setConfirmDelete(false);
      setError(caught instanceof Error ? caught.message : 'Terjadi kesalahan.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          to={paths.adminMessages}
          className="inline-flex items-center gap-2 rounded text-caption font-medium text-content-secondary hover:text-content-primary"
        >
          <IconArrowLeft size={16} aria-hidden="true" />
          Pesan masuk
        </Link>
        <h1 className="text-h5 font-semibold break-words">{item.subject}</h1>
      </div>

      {error && <Alert variant="critical" message={error} />}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-5 rounded-xl border border-stroke-primary bg-background-primary p-4 sm:p-6">
          <dl className="grid gap-3 text-caption sm:grid-cols-[140px_1fr]">
            <dt className="text-content-secondary">Nama</dt>
            <dd className="font-medium text-content-primary">{item.name}</dd>
            <dt className="text-content-secondary">Email</dt>
            <dd>
              <a
                href={mailto(item.email)}
                className="text-primary-600 underline underline-offset-2"
              >
                {item.email}
              </a>
            </dd>
            <dt className="text-content-secondary">Nomor ponsel</dt>
            <dd className="text-content-primary">
              {item.phone ? (
                <a
                  href={`tel:${item.phone}`}
                  className="text-primary-600 underline underline-offset-2"
                >
                  {item.phone}
                </a>
              ) : (
                'Tidak diisi'
              )}
            </dd>
            <dt className="text-content-secondary">Diterima</dt>
            <dd className="text-content-primary">
              <time dateTime={item.received_at}>{formatDateTime(item.received_at)}</time>
            </dd>
          </dl>
          <div className="border-t border-stroke-primary pt-5">
            <h2 className="sr-only">Isi pesan</h2>
            {/* Teks biasa (bukan HTML): baris baru dipertahankan, tidak ada markup yang dirender. */}
            <p className="whitespace-pre-wrap break-words text-body-sm text-content-primary">
              {item.message}
            </p>
          </div>
        </div>

        <aside aria-label="Tindakan pesan" className="flex flex-col gap-2 lg:self-start">
          <ButtonLink to={mailto(item.email, `Re: ${item.subject}`)}>
            <IconMailForward size={18} aria-hidden="true" />
            Balas lewat email
          </ButtonLink>
          <Button hierarchy="secondary" disabled={mark.isPending} onClick={() => void toggleRead()}>
            {item.read_at === null ? 'Tandai sudah dibaca' : 'Tandai belum dibaca'}
          </Button>
          <Button hierarchy="tertiary" onClick={() => setConfirmDelete(true)}>
            Hapus pesan
          </Button>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Hapus pesan?"
        description="Pesan dan data pengirimnya dihapus permanen dan tidak dapat dipulihkan."
        confirmLabel="Hapus pesan"
        destructive
        pending={remove.isPending}
        onConfirm={() => void handleDelete()}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
