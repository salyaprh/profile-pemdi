import type { Page } from '@playwright/test';
import { audit } from './a11y.helper';
import { chooseFile, loginAs, logout, sampleImage, uniqueSuffix } from './admin.helper';
import { expect, test } from './fixtures';

// Alur artikel ujung ke ujung terhadap backend Laravel sungguhan: editor WYSIWYG, unggah gambar,
// penyaring HTML di server, dan alur tinjauan maker-checker (Penulis menulis, Admin menerbitkan).

const UPLOADED_IMAGE = /^\/storage\/media-e2e\/[0-9a-f-]{36}\.webp$/;

/** Bagian editor TipTap yang dibaca uji (TipTap memasang instansnya di elemen editor sebagai .editor). */
interface TiptapEditor {
  state: {
    selection: { from: number; to: number };
    doc: { textBetween: (from: number, to: number) => string };
  };
}

const editorOf = (page: Page) => page.getByRole('textbox', { name: /^Isi artikel/ });
const toolbarButton = (page: Page, name: string) =>
  page.getByRole('toolbar', { name: 'Format isi artikel' }).getByRole('button', { name });

/** Membuka artikel lewat pencarian judul di daftar (uji lain mungkin menambah artikel paralel). */
async function openArticle(page: Page, title: string, status: string) {
  await page.goto(`/admin/artikel?status=${status}&cari=${encodeURIComponent(title)}`);
  await page.getByRole('link', { name: title }).click();
  await expect(page.getByRole('heading', { name: 'Edit artikel', level: 1 })).toBeVisible();
}

test('Penulis menulis dan mengajukan; Admin mengembalikan, lalu menerbitkan setelah diperbaiki', async ({
  page,
}) => {
  test.slow(); // empat kali login dan dua unggahan gambar
  const title = `Integrasi Layanan Digital ASN ${uniqueSuffix()}`;
  const note = 'Tambahkan sumber informasi sebelum diterbitkan.';

  // --- Penulis menulis artikel baru ---
  await loginAs(page, 'penulis');
  await page.goto('/admin/artikel');
  await page.getByRole('link', { name: 'Tulis artikel' }).first().click();
  await expect(page.getByRole('heading', { name: 'Tulis artikel', level: 1 })).toBeVisible();

  await page.getByRole('textbox', { name: /^Judul/ }).fill(title);
  await page.getByRole('combobox', { name: /^Kategori/ }).selectOption({ label: 'Layanan Publik' });
  await page
    .getByRole('textbox', { name: /^Ringkasan/ })
    .fill('Uji e2e: artikel ini ditulis lewat editor WYSIWYG dan diterbitkan lewat alur tinjauan.');

  await chooseFile(
    page,
    page.getByRole('button', { name: 'Pilih gambar', exact: true }),
    sampleImage,
  );
  await expect(page.getByRole('img', { name: 'Pratinjau gambar sampul' })).toHaveAttribute(
    'src',
    UPLOADED_IMAGE,
  );

  // Isi artikel: judul bagian, teks tebal, tautan, dan gambar lewat toolbar.
  const editor = editorOf(page);
  await editor.click();
  await toolbarButton(page, 'Judul bagian').click();
  await expect(toolbarButton(page, 'Judul bagian')).toHaveAttribute('aria-pressed', 'true');
  await expect(editor).toBeFocused();
  await page.keyboard.type('Latar belakang');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Program ini menyatukan ');
  await toolbarButton(page, 'Tebal').click();
  await expect(editor).toBeFocused();
  await page.keyboard.type('layanan digital');
  await toolbarButton(page, 'Tebal').click();
  await expect(editor).toBeFocused();
  await page.keyboard.type(' bagi ASN.');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Situs Kementerian PANRB');
  // Paragraf dipilih dengan klik tiga kali: ProseMirror menetapkan seleksinya sendiri. Rangkaian
  // Shift+panah yang cepat kadang tidak tersalin utuh ke state editor di emulasi Android.
  await editor.getByText('Situs Kementerian PANRB').click({ clickCount: 3 });
  // Seleksi dibaca dari state editor (bukan DOM), karena toolbar bekerja pada state itu.
  const selectedText = () =>
    editor.evaluate((element) => {
      const { state } = (element as HTMLElement & { editor: TiptapEditor }).editor;
      return state.doc.textBetween(state.selection.from, state.selection.to);
    });
  await expect.poll(selectedText).toBe('Situs Kementerian PANRB');

  await toolbarButton(page, 'Tautan').click();
  const linkDialog = page.getByRole('dialog', { name: 'Sisipkan tautan' });
  const href = linkDialog.getByRole('textbox', { name: 'Alamat tautan' });
  await expect(href).toBeFocused();
  // Alamat berbahaya ditolak di browser (backend juga menyaringnya).
  await href.fill('javascript:alert(1)');
  await linkDialog.getByRole('button', { name: 'Simpan tautan' }).click();
  await expect(linkDialog.getByText('Gunakan alamat https://')).toBeVisible();
  expect(await audit(page)).toEqual([]);
  await href.fill('www.menpan.go.id');
  await linkDialog.getByRole('button', { name: 'Simpan tautan' }).click();
  await expect(linkDialog).toBeHidden();
  await expect(editor.getByRole('link', { name: 'Situs Kementerian PANRB' })).toHaveAttribute(
    'href',
    'https://www.menpan.go.id',
  );
  // Fokus kembali ke editor dengan teks tautan masih terpilih; panah kanan menaruh kursor di
  // akhir paragraf (ditunggu sampai tersalin ke state sebelum Enter).
  await expect(editor).toBeFocused();
  await expect.poll(selectedText).toBe('Situs Kementerian PANRB');
  await page.keyboard.press('ArrowRight');
  await expect.poll(selectedText).toBe('');
  await page.keyboard.press('Enter');

  await toolbarButton(page, 'Gambar').click();
  const imageDialog = page.getByRole('dialog', { name: 'Sisipkan gambar' });
  await expect(
    imageDialog.getByRole('button', { name: 'Pilih gambar', exact: true }),
  ).toBeFocused();
  await chooseFile(
    page,
    imageDialog.getByRole('button', { name: 'Pilih gambar', exact: true }),
    sampleImage,
  );
  await expect(imageDialog.getByText('Gambar siap disisipkan.')).toBeVisible();
  // Teks alternatif awal diambil dari nama berkas, lalu diganti dengan deskripsi yang bermakna.
  const alt = imageDialog.getByRole('textbox', { name: /^Teks alternatif/ });
  await expect(alt).toHaveValue('article 2');
  expect(await audit(page)).toEqual([]);
  await alt.fill('Ilustrasi layanan digital ASN');
  await imageDialog.getByRole('button', { name: 'Sisipkan gambar' }).click();
  await expect(imageDialog).toBeHidden();
  const bodyImage = editor.getByRole('img', { name: 'Ilustrasi layanan digital ASN' });
  await expect(bodyImage).toHaveAttribute('src', UPLOADED_IMAGE);
  await expect
    .poll(() => bodyImage.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBe(328);

  await page.getByRole('button', { name: 'Simpan draf' }).click();
  await expect(page.getByText('Draf tersimpan')).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/artikel\/\d+$/);
  const articleUrl = new URL(page.url()).pathname;

  await page.getByRole('button', { name: 'Ajukan untuk ditinjau' }).click();
  await expect(page.getByText('Artikel diajukan untuk ditinjau')).toBeVisible();
  await expect(page.getByText('Artikel sedang menunggu tinjauan Admin.')).toBeVisible();
  await expect(page.getByRole('textbox', { name: /^Judul/ })).toBeDisabled();
  await logout(page);

  // --- Admin mengembalikan dengan catatan ---
  await loginAs(page, 'admin');
  await openArticle(page, title, 'ditinjau');
  await page.getByRole('button', { name: 'Kembalikan ke Penulis' }).click();
  const returnDialog = page.getByRole('dialog', { name: 'Kembalikan ke Penulis?' });
  const noteField = returnDialog.getByRole('textbox', { name: /^Catatan perbaikan/ });
  await expect(noteField).toBeFocused();
  // Catatan wajib: Penulis perlu tahu apa yang harus diperbaiki.
  await returnDialog.getByRole('button', { name: 'Kembalikan', exact: true }).click();
  await expect(returnDialog.getByText('Catatan minimal 5 karakter')).toBeVisible();
  expect(await audit(page)).toEqual([]);
  await noteField.fill(note);
  await returnDialog.getByRole('button', { name: 'Kembalikan', exact: true }).click();
  await expect(returnDialog).toBeHidden();
  await expect(page.getByText('Artikel dikembalikan ke Penulis')).toBeVisible();
  await logout(page);

  // --- Penulis memperbaiki dan mengajukan ulang ---
  await loginAs(page, 'penulis');
  await page.goto(`/admin/artikel?status=draf&cari=${encodeURIComponent(title)}`);
  const row = page.getByRole('row').filter({ hasText: title });
  await expect(row.getByText('Dikembalikan dengan catatan dari Admin')).toBeVisible();
  await row.getByRole('link', { name: title }).click();
  await expect(page.getByText(note)).toBeVisible();
  await page.getByRole('textbox', { name: /^Sumber/ }).fill('Biro Hubungan Masyarakat');
  // Perubahan yang belum disimpan ikut tersimpan saat diajukan.
  await page.getByRole('button', { name: 'Ajukan untuk ditinjau' }).click();
  await expect(page.getByText('Artikel diajukan untuk ditinjau')).toBeVisible();
  await expect(page.getByRole('textbox', { name: /^Sumber/ })).toHaveValue(
    'Biro Hubungan Masyarakat',
  );
  await logout(page);

  // --- Admin menerbitkan ---
  await loginAs(page, 'admin');
  await openArticle(page, title, 'ditinjau');
  await page.getByRole('button', { name: 'Terbitkan' }).click();
  await expect(page.getByText('Artikel diterbitkan')).toBeVisible();
  await expect(
    page
      .getByRole('complementary', { name: 'Status dan tindakan' })
      .getByText('Terbit', { exact: true })
      .first(),
  ).toBeVisible();

  // Yang tersimpan di database adalah HTML hasil penyaring server.
  const response = await page.request.get(`/api${articleUrl.replace('/artikel/', '/articles/')}`, {
    headers: { Accept: 'application/json' },
  });
  expect(response.ok()).toBe(true);
  const { data } = (await response.json()) as {
    data: { slug: string; status: string; body_html: string; cover_url: string; source: string };
  };
  expect(data).toMatchObject({ status: 'terbit', source: 'Biro Hubungan Masyarakat' });
  expect(data.cover_url).toMatch(UPLOADED_IMAGE);
  const body = await page.evaluate((html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const link = doc.querySelector('a');
    const img = doc.querySelector('img');
    return {
      heading: doc.querySelector('h2')?.textContent,
      bold: doc.querySelector('strong')?.textContent,
      link: [link?.textContent, link?.getAttribute('href'), link?.getAttribute('rel')],
      image: [img?.getAttribute('src'), img?.getAttribute('alt')],
    };
  }, data.body_html);
  expect(body).toEqual({
    heading: 'Latar belakang',
    bold: 'layanan digital',
    link: ['Situs Kementerian PANRB', 'https://www.menpan.go.id', 'noopener noreferrer'],
    image: [expect.stringMatching(UPLOADED_IMAGE), 'Ilustrasi layanan digital ASN'],
  });

  // Gambar unggahan dilayani sebagai WebP dengan header keamanan yang sama dengan halaman.
  const image = await page.request.get(data.cover_url);
  expect(image.headers()['content-type']).toBe('image/webp');
  expect(image.headers()['x-content-type-options']).toBe('nosniff');

  // Artikel yang terbit langsung tampil di situs publik, tanpa build ulang.
  await page.goto(`/portfolio/${data.slug}`);
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  const publicBody = page.locator('.article-body');
  await expect(publicBody.getByRole('heading', { level: 2, name: 'Latar belakang' })).toBeVisible();
  await expect(publicBody.getByRole('link', { name: 'Situs Kementerian PANRB' })).toHaveAttribute(
    'href',
    'https://www.menpan.go.id',
  );
  const publicImage = publicBody.getByRole('img', { name: 'Ilustrasi layanan digital ASN' });
  await expect
    .poll(() => publicImage.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBe(328);
  await expect(page.getByText('Sumber: Biro Hubungan Masyarakat')).toBeVisible();
  expect(await audit(page)).toEqual([]);
});

test('perubahan yang belum disimpan meminta konfirmasi sebelum meninggalkan editor', async ({
  page,
}) => {
  await loginAs(page, 'penulis');
  await page.goto('/admin/artikel/baru');
  const title = page.getByRole('textbox', { name: /^Judul/ });
  await title.fill('Draf yang belum disimpan');
  await expect(page.getByText('Ada perubahan yang belum disimpan.')).toBeVisible();

  const messages: string[] = [];
  page.once('dialog', (dialog) => {
    messages.push(dialog.message());
    void dialog.dismiss();
  });
  await page.getByRole('link', { name: 'Daftar artikel' }).click();
  await expect.poll(() => messages).toEqual(['Perubahan belum disimpan. Tinggalkan halaman ini?']);
  await expect(page).toHaveURL('/admin/artikel/baru');
  await expect(title).toHaveValue('Draf yang belum disimpan');

  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByRole('link', { name: 'Daftar artikel' }).click();
  await expect(page).toHaveURL('/admin/artikel');
  await expect(page.getByRole('heading', { name: 'Artikel', level: 1 })).toBeVisible();
});

test('formulir kosong: galat per kolom, fokus ke kolom pertama, dan lolos axe', async ({
  page,
}) => {
  await loginAs(page, 'penulis');
  await page.goto('/admin/artikel/baru');
  await expect(page.getByRole('heading', { name: 'Tulis artikel', level: 1 })).toBeVisible();
  expect(await audit(page)).toEqual([]);

  await page.getByRole('button', { name: 'Simpan draf' }).click();
  await expect(page.getByRole('textbox', { name: /^Judul/ })).toBeFocused();
  await expect(page.getByText('Judul wajib diisi')).toBeVisible();
  await expect(page.getByText('Kategori wajib dipilih')).toBeVisible();
  await expect(page.getByText('Isi artikel wajib diisi')).toBeVisible();
  await expect(editorOf(page)).toHaveAttribute('aria-invalid', 'true');
  expect(await audit(page)).toEqual([]);
});

test('toolbar editor: satu tab stop, panah berpindah antar tombol', async ({ page }) => {
  await loginAs(page, 'penulis');
  await page.goto('/admin/artikel/baru');

  const first = toolbarButton(page, 'Paragraf');
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(toolbarButton(page, 'Judul bagian')).toBeFocused();
  await page.keyboard.press('End');
  // Ulangi belum tersedia, tetapi tetap bisa difokus (aria-disabled) agar keberadaannya terbaca.
  await expect(toolbarButton(page, 'Ulangi')).toBeFocused();
  await expect(toolbarButton(page, 'Ulangi')).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(first).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(editorOf(page)).toBeFocused();
});

test('daftar artikel Admin dengan filter status lolos axe', async ({ page }) => {
  await loginAs(page, 'admin');
  await page.goto('/admin/artikel?status=terbit');
  await expect(page.getByRole('region', { name: 'Tabel artikel' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Terbit', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  expect(await audit(page)).toEqual([]);
});
