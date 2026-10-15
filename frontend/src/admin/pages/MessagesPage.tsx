import { Alert, Badge, Button } from '@idds/react';
import { IconMail } from '@tabler/icons-react';
import EmptyState from '../../components/EmptyState';
import FilterChips from '../../components/FilterChips';
import PaginationNav from '../../components/PaginationNav';
import { formatDateTime } from '../../lib/format';
import { Link, navigate, paths, useLocation } from '../../lib/router';
import { usePageMeta } from '../../lib/seo';
import { useMessages, type MessageFilter } from '../messages/api';

export function messagesUrl(filter: MessageFilter, page = 1): string {
  const params = new URLSearchParams();
  if (filter === 'belum-dibaca') params.set('status', 'belum-dibaca');
  if (page > 1) params.set('halaman', String(page));
  const query = params.toString();
  return query ? `${paths.adminMessages}?${query}` : paths.adminMessages;
}

/** Kotak masuk pesan dari formulir "Hubungi kami" (khusus Admin). */
export default function MessagesPage() {
  usePageMeta({ title: 'Pesan masuk', noindex: true });

  const { searchParams } = useLocation();
  const filter: MessageFilter =
    searchParams.get('status') === 'belum-dibaca' ? 'belum-dibaca' : 'semua';
  const requestedPage = Math.floor(Number(searchParams.get('halaman')));
  const page = requestedPage > 1 ? requestedPage : 1;
  const messages = useMessages(filter, page);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-h5 font-semibold">Pesan masuk</h1>
        <p className="text-caption text-content-secondary">
          Pesan dari formulir Hubungi kami. Data pengirim disimpan terenkripsi dan dihapus otomatis
          12 bulan setelah diterima.
        </p>
      </div>

      <div className="rounded-xl border border-stroke-primary bg-background-primary p-4">
        <FilterChips
          label="Filter pesan"
          options={[
            { label: 'Semua', value: 'semua' },
            { label: 'Belum dibaca', value: 'belum-dibaca' },
          ]}
          selected={filter}
          onSelect={(value) => navigate(messagesUrl(value), { replace: true, scroll: false })}
        />
      </div>

      <p role="status" className="text-caption text-content-secondary">
        {messages.isPending ? 'Memuat pesan…' : `${messages.data?.meta.total ?? 0} pesan`}
      </p>

      {messages.isError ? (
        <div className="space-y-3">
          <Alert variant="critical" title="Pesan gagal dimuat" message={messages.error.message} />
          <Button hierarchy="secondary" onClick={() => void messages.refetch()}>
            Coba lagi
          </Button>
        </div>
      ) : messages.data && messages.data.data.length === 0 ? (
        <EmptyState
          icon={<IconMail size={32} aria-hidden="true" />}
          title={filter === 'belum-dibaca' ? 'Semua pesan sudah dibaca' : 'Belum ada pesan'}
          description={
            filter === 'belum-dibaca'
              ? 'Pesan baru dari formulir Hubungi kami akan tampil di sini.'
              : 'Pesan yang dikirim pengunjung lewat formulir Hubungi kami akan tampil di sini.'
          }
        />
      ) : (
        messages.data && (
          <>
            <ul className="divide-y divide-stroke-primary rounded-xl border border-stroke-primary bg-background-primary">
              {messages.data.data.map((message) => {
                const unread = message.read_at === null;
                return (
                  <li
                    key={message.id}
                    className="flex flex-col gap-1 px-4 py-4 sm:flex-row sm:gap-4"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={paths.adminMessage(message.id)}
                          className={`text-body-sm hover:text-primary-600 hover:underline ${
                            unread ? 'font-semibold text-content-primary' : 'text-content-primary'
                          }`}
                        >
                          {message.subject}
                        </Link>
                        {unread && (
                          <Badge variant="info" size="sm">
                            Belum dibaca
                          </Badge>
                        )}
                      </div>
                      <p className="text-caption text-content-secondary">
                        {message.name} · {message.email}
                      </p>
                      <p className="line-clamp-2 text-caption text-content-secondary">
                        {message.preview}
                      </p>
                    </div>
                    <p className="whitespace-nowrap text-caption-sm text-content-secondary">
                      <time dateTime={message.received_at}>
                        {formatDateTime(message.received_at)}
                      </time>
                    </p>
                  </li>
                );
              })}
            </ul>
            <PaginationNav
              currentPage={messages.data.meta.current_page}
              totalPages={messages.data.meta.last_page}
              hrefFor={(target) => messagesUrl(filter, target)}
            />
          </>
        )
      )}
    </div>
  );
}
