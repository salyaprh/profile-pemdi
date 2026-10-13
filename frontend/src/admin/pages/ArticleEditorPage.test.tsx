import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server } from '../../test/server';
import { renderWithToast, setUrl } from '../../test/utils';
import AdminApp from '../AdminApp';
import type { AdminArticle } from '../articles/types';
import { createAdminQueryClient } from '../queryClient';
import { adminUser, makeArticle, mockSession, penulisUser } from '../test-helpers';
import { UNSAVED_CHANGES_MESSAGE } from '../useUnsavedChangesGuard';

/** Label kolom judul ("Judul *"); bukan tombol toolbar "Judul bagian". */
const TITLE = /^Judul\s*\*?$/;

function setup(url: string) {
  setUrl(url);
  const user = userEvent.setup();
  renderWithToast(<AdminApp queryClient={createAdminQueryClient({ queries: { retry: false } })} />);
  return user;
}

/** Artikel tiruan yang bisa diubah lewat PUT dan aksi alur tinjauan. */
function mockArticle(initial: AdminArticle) {
  let current = initial;
  const calls: { method: string; path: string; body: unknown }[] = [];
  const record = async (request: Request) => {
    const text = await request.text();
    calls.push({
      method: request.method,
      path: new URL(request.url).pathname,
      body: text ? (JSON.parse(text) as unknown) : null,
    });
  };

  server.use(
    http.get(`/api/admin/articles/${initial.id}`, () => HttpResponse.json({ data: current })),
    http.put(`/api/admin/articles/${initial.id}`, async ({ request }) => {
      await record(request.clone());
      const body = (await request.json()) as Partial<AdminArticle>;
      current = {
        ...current,
        title: body.title ?? current.title,
        updated_at: '2026-10-13T04:00:00+00:00',
      };
      return HttpResponse.json({ data: current });
    }),
    http.post(`/api/admin/articles/${initial.id}/:action`, async ({ request, params }) => {
      await record(request);
      const changes: Record<string, Partial<AdminArticle>> = {
        submit: {
          status: 'ditinjau',
          status_label: 'Menunggu tinjauan',
          can: { ...current.can, submit: false, update: false, withdraw: true },
        },
        publish: {
          status: 'terbit',
          status_label: 'Terbit',
          published_at: '2026-10-13T05:00:00+00:00',
          can: { ...current.can, publish: false, unpublish: true },
        },
      };
      current = { ...current, ...changes[String(params.action)] };
      return HttpResponse.json({ data: current });
    }),
  );
  return calls;
}

describe('tulis artikel baru', () => {
  it('validasi di browser: kolom wajib, fokus ke kolom pertama yang salah, tanpa permintaan', async () => {
    mockSession(penulisUser);
    const posted = vi.fn();
    server.use(
      http.post('/api/admin/articles', () => {
        posted();
        return new HttpResponse(null, { status: 500 });
      }),
    );
    const user = setup('/admin/artikel/baru');

    await user.click(await screen.findByRole('button', { name: 'Simpan draf' }));

    expect(screen.getByText('Judul wajib diisi')).toBeInTheDocument();
    expect(screen.getByText('Kategori wajib dipilih')).toBeInTheDocument();
    expect(screen.getByText('Ringkasan wajib diisi')).toBeInTheDocument();
    expect(screen.getByText('Isi artikel wajib diisi')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: TITLE })).toHaveFocus();
    expect(screen.getByRole('textbox', { name: /Isi artikel/ })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(posted).not.toHaveBeenCalled();
  });

  it('slug yang salah format ditolak sebelum dikirim', async () => {
    mockSession(penulisUser);
    const user = setup('/admin/artikel/baru');

    await user.type(await screen.findByLabelText(/^Slug/), 'Bukan Slug!');
    await user.click(screen.getByRole('button', { name: 'Simpan draf' }));

    expect(
      screen.getByText(
        'Slug hanya boleh huruf kecil, angka, dan tanda hubung (mis. layanan-digital-asn)',
      ),
    ).toBeInTheDocument();
  });
});

describe('edit artikel', () => {
  it('memuat artikel, menyimpan perubahan dengan updated_at (penguncian optimistis)', async () => {
    mockSession(penulisUser);
    const calls = mockArticle(
      makeArticle({ can: { update: true, submit: true } as AdminArticle['can'] }),
    );
    const user = setup('/admin/artikel/7');

    const title = await screen.findByRole('textbox', { name: TITLE });
    expect(title).toHaveValue('Integrasi Layanan Digital ASN');
    expect(screen.getByRole('textbox', { name: /Isi artikel/ })).toHaveTextContent(
      'Isi awal artikel.',
    );

    await user.clear(title);
    await user.type(title, 'Judul yang diperbarui');
    expect(screen.getByText('Ada perubahan yang belum disimpan.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Simpan draf' }));

    expect(await screen.findByText('Perubahan tersimpan')).toBeInTheDocument();
    expect(calls[0]).toMatchObject({
      method: 'PUT',
      body: {
        title: 'Judul yang diperbarui',
        slug: 'integrasi-layanan-digital-asn',
        category_id: 1,
        source: null,
        updated_at: '2026-10-13T03:00:00+00:00',
      },
    });
    expect(screen.queryByText('Ada perubahan yang belum disimpan.')).not.toBeInTheDocument();
  });

  it('Penulis mengajukan; perubahan yang belum disimpan ikut disimpan dulu', async () => {
    mockSession(penulisUser);
    const calls = mockArticle(
      makeArticle({ can: { update: true, submit: true } as AdminArticle['can'] }),
    );
    const user = setup('/admin/artikel/7');

    await user.type(await screen.findByLabelText(/^Sumber/), 'Biro Humas');
    await user.click(screen.getByRole('button', { name: 'Ajukan untuk ditinjau' }));

    expect(await screen.findByText('Artikel diajukan untuk ditinjau')).toBeInTheDocument();
    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual([
      'PUT /api/admin/articles/7',
      'POST /api/admin/articles/7/submit',
    ]);
    // Setelah diajukan, Penulis tidak bisa mengedit sampai pengajuan ditarik.
    expect(screen.getByRole('textbox', { name: TITLE })).toBeDisabled();
    expect(screen.getByText(/Artikel sedang menunggu tinjauan Admin/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tarik pengajuan' })).toBeInTheDocument();
  });

  it('catatan perbaikan dari Admin tampil untuk Penulis', async () => {
    mockSession(penulisUser);
    mockArticle(
      makeArticle({
        review_note: 'Tambahkan sumber data.',
        can: { update: true } as AdminArticle['can'],
      }),
    );
    setup('/admin/artikel/7');

    const note = await screen.findByText('Tambahkan sumber data.');
    expect(note.closest('[role="alert"]') ?? note.parentElement).toHaveTextContent(
      'Catatan perbaikan dari Admin',
    );
  });

  it('Admin mengembalikan pengajuan: catatan wajib diisi di dialog', async () => {
    mockSession(adminUser);
    const calls = mockArticle(
      makeArticle({
        status: 'ditinjau',
        status_label: 'Menunggu tinjauan',
        can: { update: true, publish: true, return: true } as AdminArticle['can'],
      }),
    );
    server.use(
      http.post('/api/admin/articles/7/return', async ({ request }) => {
        calls.push({
          method: 'POST',
          path: '/api/admin/articles/7/return',
          body: await request.json(),
        });
        return HttpResponse.json({ data: makeArticle({ review_note: 'Perbaiki judul.' }) });
      }),
    );
    const user = setup('/admin/artikel/7');

    await user.click(await screen.findByRole('button', { name: 'Kembalikan ke Penulis' }));
    const dialog = await screen.findByRole('dialog', { name: 'Kembalikan ke Penulis?' });
    await user.click(within(dialog).getByRole('button', { name: 'Kembalikan' }));
    expect(within(dialog).getByText(/Catatan minimal 5 karakter/)).toBeInTheDocument();

    // Fokus awal dialog pindah ke kolom catatan (setelah Modal IDDS selesai memfokuskan dirinya).
    const noteField = within(dialog).getByLabelText(/Catatan perbaikan/);
    await waitFor(() => expect(noteField).toHaveFocus());
    await user.keyboard('Perbaiki judul.');
    await user.click(within(dialog).getByRole('button', { name: 'Kembalikan' }));

    expect(await screen.findByText('Artikel dikembalikan ke Penulis')).toBeInTheDocument();
    expect(calls.at(-1)).toEqual({
      method: 'POST',
      path: '/api/admin/articles/7/return',
      body: { note: 'Perbaiki judul.' },
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('galat validasi dari server tampil di kolomnya', async () => {
    mockSession(adminUser);
    mockArticle(makeArticle({ can: { update: true } as AdminArticle['can'] }));
    server.use(
      http.put('/api/admin/articles/7', () =>
        HttpResponse.json(
          {
            message: 'Slug ini sudah dipakai artikel lain.',
            errors: { slug: ['Slug ini sudah dipakai artikel lain.'] },
          },
          { status: 422 },
        ),
      ),
    );
    const user = setup('/admin/artikel/7');

    await user.click(await screen.findByRole('button', { name: 'Simpan draf' }));

    expect(await screen.findByText('Slug ini sudah dipakai artikel lain.')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Slug/)).toHaveFocus();
  });

  it('bentrok edit (409): pesan jelas dan tombol muat ulang versi terbaru', async () => {
    mockSession(adminUser);
    mockArticle(makeArticle({ can: { update: true } as AdminArticle['can'] }));
    server.use(
      http.put('/api/admin/articles/7', () =>
        HttpResponse.json(
          { message: 'Artikel ini sudah diubah pengguna lain sejak Anda membukanya.' },
          { status: 409 },
        ),
      ),
    );
    const user = setup('/admin/artikel/7');

    await user.click(await screen.findByRole('button', { name: 'Simpan draf' }));

    expect(
      await screen.findByText('Artikel ini sudah diubah pengguna lain sejak Anda membukanya.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Muat ulang versi terbaru' })).toBeInTheDocument();
  });

  it('artikel terbit dibuka Penulis: baca saja dengan penjelasan', async () => {
    mockSession(penulisUser);
    mockArticle(makeArticle({ status: 'terbit', status_label: 'Terbit' }));
    setup('/admin/artikel/7');

    expect(
      await screen.findByText(/Hanya Admin yang dapat mengubah artikel yang sudah terbit/),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: TITLE })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Simpan/ })).not.toBeInTheDocument();
  });

  it('artikel yang tidak ada atau bukan milik sendiri', async () => {
    mockSession(penulisUser);
    server.use(
      http.get('/api/admin/articles/99', () =>
        HttpResponse.json({ message: 'x' }, { status: 403 }),
      ),
    );
    setup('/admin/artikel/99');

    expect(await screen.findByText('Artikel tidak ditemukan')).toBeInTheDocument();
  });

  it('meninggalkan halaman dengan perubahan belum disimpan meminta konfirmasi', async () => {
    mockSession(penulisUser);
    mockArticle(makeArticle({ can: { update: true } as AdminArticle['can'] }));
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = setup('/admin/artikel/7');

    await user.type(await screen.findByRole('textbox', { name: TITLE }), ' (revisi)');
    await user.click(screen.getByRole('link', { name: 'Daftar artikel' }));

    expect(confirm).toHaveBeenCalledWith(UNSAVED_CHANGES_MESSAGE);
    expect(window.location.pathname).toBe('/admin/artikel/7');

    confirm.mockReturnValue(true);
    server.use(
      http.get('/api/admin/articles', () =>
        HttpResponse.json({
          data: [],
          meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 },
        }),
      ),
    );
    await user.click(screen.getByRole('link', { name: 'Daftar artikel' }));
    expect(window.location.pathname).toBe('/admin/artikel');
  });
});
