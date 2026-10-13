import { useState, type FormEvent } from 'react';
import { Alert, Button, TextArea, TextField, useToast } from '@idds/react';
import { IconArrowLeft } from '@tabler/icons-react';
import ButtonLink from '../../components/ButtonLink';
import EmptyState from '../../components/EmptyState';
import { formatDateTime } from '../../lib/format';
import { Link, navigate, paths } from '../../lib/router';
import { usePageMeta } from '../../lib/seo';
import { ApiError } from '../../services/api';
import {
  useArticle,
  useArticleAction,
  useCategories,
  useDeleteArticle,
  useSaveArticle,
} from '../articles/api';
import type { AdminArticle, ArticleAction, ArticleInput } from '../articles/types';
import { useAuthenticatedUser } from '../auth';
import ConfirmDialog from '../components/ConfirmDialog';
import CoverImageField from '../components/CoverImageField';
import StatusBadge from '../components/StatusBadge';
import SelectField from '../components/SelectField';
import RichTextEditor from '../editor/RichTextEditor';
import { useUnsavedChangesGuard } from '../useUnsavedChangesGuard';
import LoadError from '../components/LoadError';

type Field = 'title' | 'slug' | 'excerpt' | 'body_html' | 'category_id' | 'cover_url' | 'source';
type FieldErrors = Partial<Record<Field, string>>;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EXCERPT_MAX = 300;

/** id elemen per kolom, untuk memindahkan fokus ke kolom pertama yang bermasalah. */
const fieldIds: Record<Field, string> = {
  title: 'artikel-judul',
  slug: 'artikel-slug',
  category_id: 'artikel-kategori-pilih',
  excerpt: 'artikel-ringkasan',
  cover_url: 'artikel-sampul-hint',
  body_html: 'artikel-isi',
  source: 'artikel-sumber',
};
const fieldOrder = Object.keys(fieldIds) as Field[];

function toInput(article: AdminArticle | null): ArticleInput {
  return {
    title: article?.title ?? '',
    slug: article?.slug ?? '',
    excerpt: article?.excerpt ?? '',
    body_html: article?.body_html ?? '',
    category_id: article?.category.id ?? null,
    cover_url: article?.cover_url ?? null,
    source: article?.source ?? '',
  };
}

const sameInput = (a: ArticleInput, b: ArticleInput) =>
  (Object.keys(a) as (keyof ArticleInput)[]).every((key) => a[key] === b[key]);

/** Aturan yang sama dengan App\Http\Requests\ArticleRequest, agar galat tampil sebelum dikirim. */
function validate(values: ArticleInput): FieldErrors {
  const errors: FieldErrors = {};
  const title = values.title.trim();
  if (!title) errors.title = 'Judul wajib diisi';
  else if (title.length < 5) errors.title = 'Judul minimal 5 karakter';
  if (values.slug.trim() && !SLUG_PATTERN.test(values.slug.trim())) {
    errors.slug =
      'Slug hanya boleh huruf kecil, angka, dan tanda hubung (mis. layanan-digital-asn)';
  }
  if (values.category_id === null) errors.category_id = 'Kategori wajib dipilih';
  const excerpt = values.excerpt.trim();
  if (!excerpt) errors.excerpt = 'Ringkasan wajib diisi';
  else if (excerpt.length < 20) errors.excerpt = 'Ringkasan minimal 20 karakter';
  if (!values.body_html) errors.body_html = 'Isi artikel wajib diisi';
  return errors;
}

function focusField(field: Field) {
  document.getElementById(fieldIds[field])?.focus();
}

const actionToasts: Record<ArticleAction | 'restore', string> = {
  submit: 'Artikel diajukan untuk ditinjau',
  withdraw: 'Pengajuan ditarik; artikel kembali menjadi draf',
  publish: 'Artikel diterbitkan',
  return: 'Artikel dikembalikan ke Penulis',
  unpublish: 'Penerbitan dibatalkan; artikel kembali menjadi draf',
  restore: 'Artikel dipulihkan dari sampah',
};

/** Halaman tulis/edit artikel: /admin/artikel/baru dan /admin/artikel/:id. */
export default function ArticleEditorPage({ articleId }: { articleId: number | null }) {
  const article = useArticle(articleId);

  if (articleId !== null && article.isPending) {
    return (
      <p role="status" className="text-caption text-content-secondary">
        Memuat artikel…
      </p>
    );
  }

  if (articleId !== null && article.isError) {
    const notFound = article.error instanceof ApiError && [403, 404].includes(article.error.status);
    return notFound ? (
      <EmptyState
        title="Artikel tidak ditemukan"
        description="Artikel ini tidak ada, sudah dihapus permanen, atau bukan milik Anda."
        action={<ButtonLink to={paths.adminArticles}>Kembali ke daftar artikel</ButtonLink>}
      />
    ) : (
      <LoadError
        title="Artikel gagal dimuat"
        message={article.error.message}
        onRetry={() => void article.refetch()}
      />
    );
  }

  // key: formulir mulai bersih saat berpindah artikel (mis. setelah artikel baru tersimpan).
  return <ArticleForm key={article.data?.id ?? 'baru'} article={article.data ?? null} />;
}

function ArticleForm({ article }: { article: AdminArticle | null }) {
  const isNew = article === null;
  usePageMeta({ title: isNew ? 'Tulis artikel' : `Edit: ${article.title}`, noindex: true });

  const user = useAuthenticatedUser();
  const { toast } = useToast();
  const categories = useCategories();
  const saveMutation = useSaveArticle(article?.id ?? null);
  const actionMutation = useArticleAction(article?.id ?? 0);
  const deleteMutation = useDeleteArticle(article?.id ?? 0);

  const [baseline, setBaseline] = useState(() => toInput(article));
  const [values, setValues] = useState(baseline);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [dialog, setDialog] = useState<'return' | 'unpublish' | 'delete' | 'forceDelete' | null>(
    null,
  );
  const [returnNote, setReturnNote] = useState('');
  const [returnNoteError, setReturnNoteError] = useState<string | null>(null);

  const editable = isNew || article.can.update;
  const trashed = article?.deleted_at != null;
  const dirty = editable && !sameInput(values, baseline);
  const busy = saveMutation.isPending || actionMutation.isPending || deleteMutation.isPending;
  useUnsavedChangesGuard(dirty);

  const update = <K extends keyof ArticleInput>(field: K, value: ArticleInput[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field as Field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const resetFrom = (saved: AdminArticle) => {
    const next = toInput(saved);
    setBaseline(next);
    setValues(next);
    setErrors({});
  };

  const handleError = (error: unknown) => {
    if (
      error instanceof ApiError &&
      error.status === 422 &&
      Object.keys(error.fieldErrors).length
    ) {
      const mapped: FieldErrors = {};
      for (const field of fieldOrder)
        if (error.fieldErrors[field]) mapped[field] = error.fieldErrors[field];
      setErrors(mapped);
      const first = fieldOrder.find((field) => mapped[field]);
      if (first) focusField(first);
      else setFormError(error.message);
      return;
    }
    if (error instanceof ApiError && error.status === 409) setConflict(true);
    setFormError(error instanceof Error ? error.message : 'Terjadi kesalahan.');
  };

  const save = async (): Promise<AdminArticle | null> => {
    setFormError(null);
    const nextErrors = validate(values);
    setErrors(nextErrors);
    const first = fieldOrder.find((field) => nextErrors[field]);
    if (first) {
      focusField(first);
      return null;
    }
    try {
      const saved = await saveMutation.mutateAsync({
        ...values,
        updated_at: article?.updated_at ?? null,
      });
      resetFrom(saved);
      return saved;
    } catch (error) {
      handleError(error);
      return null;
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const saved = await save();
    if (!saved) return;
    toast({
      title: isNew ? 'Draf tersimpan' : 'Perubahan tersimpan',
      state: 'positive',
      duration: 4000,
    });
    if (isNew) navigate(paths.adminArticle(saved.id), { replace: true, force: true });
  };

  const runAction = async (action: ArticleAction | 'restore', note?: string) => {
    setFormError(null);
    // Perubahan yang belum disimpan ikut disimpan dulu, agar yang diajukan/diterbitkan sesuai layar.
    if (dirty && !(await save())) return false;
    try {
      resetFrom(await actionMutation.mutateAsync({ action, note }));
      toast({ title: actionToasts[action], state: 'positive', duration: 4000 });
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  const confirmReturn = async () => {
    if (returnNote.trim().length < 5) {
      setReturnNoteError('Catatan minimal 5 karakter, agar Penulis tahu apa yang harus diperbaiki');
      return;
    }
    if (await runAction('return', returnNote.trim())) {
      setDialog(null);
      setReturnNote('');
    }
  };

  const remove = async (permanent: boolean) => {
    try {
      await deleteMutation.mutateAsync({ permanent });
      setDialog(null);
      toast({
        title: permanent ? 'Artikel dihapus permanen' : 'Artikel dipindahkan ke sampah',
        state: 'positive',
        duration: 4000,
      });
      navigate(permanent ? `${paths.adminArticles}?status=sampah` : paths.adminArticles, {
        force: true,
      });
    } catch (error) {
      setDialog(null);
      handleError(error);
    }
  };

  const readOnlyReason = trashed
    ? 'Artikel ini ada di sampah dan tidak tampil di situs. Pulihkan untuk mengubahnya lagi.'
    : article?.status === 'ditinjau'
      ? user.role === 'admin'
        ? null
        : 'Artikel sedang menunggu tinjauan Admin. Tarik pengajuan bila ingin mengubahnya.'
      : article?.status === 'terbit' && user.role !== 'admin'
        ? 'Artikel sudah terbit. Hanya Admin yang dapat mengubah artikel yang sudah terbit.'
        : null;

  const can = article?.can;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          to={paths.adminArticles}
          className="inline-flex items-center gap-2 rounded text-caption font-medium text-content-secondary hover:text-content-primary"
        >
          <IconArrowLeft size={16} aria-hidden="true" />
          Daftar artikel
        </Link>
        <h1 className="text-h5 font-semibold">{isNew ? 'Tulis artikel' : 'Edit artikel'}</h1>
      </div>

      {article?.review_note && article.status === 'draf' && (
        <Alert
          variant="caution"
          title="Catatan perbaikan dari Admin"
          message={article.review_note}
        />
      )}
      {readOnlyReason && !editable && <Alert variant="info" message={readOnlyReason} />}
      {formError && (
        <div className="space-y-2">
          <Alert variant="critical" message={formError} />
          {conflict && (
            <Button hierarchy="secondary" onClick={() => window.location.reload()}>
              Muat ulang versi terbaru
            </Button>
          )}
        </div>
      )}

      <form
        onSubmit={(event) => void handleSubmit(event)}
        noValidate
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]"
      >
        <div className="space-y-5 rounded-xl border border-stroke-primary bg-background-primary p-4 sm:p-6">
          <TextField
            id={fieldIds.title}
            name="title"
            label="Judul"
            value={values.title}
            onChange={(value) => update('title', value)}
            status={errors.title ? 'error' : 'neutral'}
            statusMessage={errors.title}
            aria-invalid={errors.title ? true : undefined}
            maxLength={200}
            disabled={!editable}
            required
          />
          <TextField
            id={fieldIds.slug}
            name="slug"
            label="Slug (alamat artikel)"
            helperText={
              isNew
                ? 'Kosongkan agar dibuat otomatis dari judul. Huruf kecil, angka, dan tanda hubung.'
                : 'Mengubah slug artikel yang sudah terbit akan mematikan tautan lama.'
            }
            value={values.slug}
            onChange={(value) => update('slug', value)}
            status={errors.slug ? 'error' : 'neutral'}
            statusMessage={errors.slug}
            aria-invalid={errors.slug ? true : undefined}
            maxLength={220}
            autoComplete="off"
            disabled={!editable}
          />
          <SelectField
            id={fieldIds.category_id}
            label="Kategori"
            required
            value={values.category_id === null ? '' : String(values.category_id)}
            onValueChange={(value) => update('category_id', value ? Number(value) : null)}
            options={(categories.data ?? []).map(({ id, name }) => ({
              value: String(id),
              label: name,
            }))}
            placeholder={categories.isPending ? 'Memuat kategori…' : 'Pilih kategori'}
            error={errors.category_id}
            disabled={!editable || categories.isPending}
          />
          <TextArea
            id={fieldIds.excerpt}
            name="excerpt"
            label="Ringkasan"
            helperText="Tampil di kartu portofolio dan hasil pencarian. 20–300 karakter."
            value={values.excerpt}
            onChange={(value) => update('excerpt', value)}
            status={errors.excerpt ? 'error' : 'neutral'}
            statusMessage={errors.excerpt}
            aria-invalid={errors.excerpt ? true : undefined}
            maxLength={EXCERPT_MAX}
            showCharCount
            minRows={3}
            disabled={!editable}
            required
          />
          <CoverImageField
            value={values.cover_url}
            onChange={(url) => update('cover_url', url)}
            disabled={!editable}
            error={errors.cover_url}
          />
          <div className="space-y-1.5">
            <p id="artikel-isi-label" className="text-caption font-medium text-content-primary">
              Isi artikel <span className="text-negative-600">*</span>
            </p>
            <RichTextEditor
              key={article?.id ?? 'baru'}
              id={fieldIds.body_html}
              labelledBy="artikel-isi-label"
              describedBy={errors.body_html ? 'artikel-isi-error' : undefined}
              initialHtml={values.body_html}
              onChange={(html) => update('body_html', html)}
              disabled={!editable}
              invalid={Boolean(errors.body_html)}
            />
            {errors.body_html && (
              <p id="artikel-isi-error" className="text-caption-sm text-negative-600">
                {errors.body_html}
              </p>
            )}
          </div>
          <TextField
            id={fieldIds.source}
            name="source"
            label="Sumber (opsional)"
            helperText="Mis. nama media atau unit kerja asal informasi."
            value={values.source}
            onChange={(value) => update('source', value)}
            status={errors.source ? 'error' : 'neutral'}
            statusMessage={errors.source}
            maxLength={255}
            disabled={!editable}
          />
        </div>

        <aside
          aria-label="Status dan tindakan"
          className="space-y-4 lg:sticky lg:top-24 lg:self-start"
        >
          <div className="space-y-3 rounded-xl border border-stroke-primary bg-background-primary p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-caption font-semibold">Status</span>
              {article ? (
                <StatusBadge
                  status={article.status}
                  label={article.status_label}
                  trashed={trashed}
                />
              ) : (
                <StatusBadge status="draf" label="Draf baru" />
              )}
            </div>
            {article && (
              <dl className="space-y-1 text-caption-sm text-content-secondary">
                <div className="flex justify-between gap-2">
                  <dt>Penulis</dt>
                  <dd className="text-right text-content-primary">{article.author.name}</dd>
                </div>
                {article.updated_at && (
                  <div className="flex justify-between gap-2">
                    <dt>Diperbarui</dt>
                    <dd className="text-right">{formatDateTime(article.updated_at)}</dd>
                  </div>
                )}
                {article.published_at && (
                  <div className="flex justify-between gap-2">
                    <dt>Terbit</dt>
                    <dd className="text-right">{formatDateTime(article.published_at)}</dd>
                  </div>
                )}
              </dl>
            )}
            {dirty && (
              <p role="status" className="text-caption-sm font-medium text-content-primary">
                Ada perubahan yang belum disimpan.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {editable && (
              <Button type="submit" disabled={busy} aria-busy={saveMutation.isPending}>
                {saveMutation.isPending
                  ? 'Menyimpan…'
                  : isNew || article.status === 'draf'
                    ? 'Simpan draf'
                    : 'Simpan perubahan'}
              </Button>
            )}
            {can?.submit && (
              <Button
                type="button"
                hierarchy="secondary"
                disabled={busy}
                onClick={() => void runAction('submit')}
              >
                Ajukan untuk ditinjau
              </Button>
            )}
            {can?.publish && (
              <Button
                type="button"
                hierarchy="secondary"
                disabled={busy}
                onClick={() => void runAction('publish')}
              >
                Terbitkan
              </Button>
            )}
            {can?.return && (
              <Button
                type="button"
                hierarchy="secondary"
                disabled={busy}
                onClick={() => setDialog('return')}
              >
                Kembalikan ke Penulis
              </Button>
            )}
            {can?.withdraw && (
              <Button
                type="button"
                hierarchy="secondary"
                disabled={busy}
                onClick={() => void runAction('withdraw')}
              >
                Tarik pengajuan
              </Button>
            )}
            {can?.unpublish && (
              <Button
                type="button"
                hierarchy="secondary"
                disabled={busy}
                onClick={() => setDialog('unpublish')}
              >
                Batalkan terbit
              </Button>
            )}
            {can?.restore && (
              <Button
                type="button"
                hierarchy="secondary"
                disabled={busy}
                onClick={() => void runAction('restore')}
              >
                Pulihkan dari sampah
              </Button>
            )}
            {can?.delete && (
              <Button
                type="button"
                hierarchy="tertiary"
                disabled={busy}
                onClick={() => setDialog('delete')}
              >
                Pindahkan ke sampah
              </Button>
            )}
            {can?.force_delete && (
              <Button
                type="button"
                hierarchy="tertiary"
                disabled={busy}
                onClick={() => setDialog('forceDelete')}
              >
                Hapus permanen
              </Button>
            )}
          </div>
        </aside>
      </form>

      <ConfirmDialog
        open={dialog === 'return'}
        title="Kembalikan ke Penulis?"
        description="Artikel kembali menjadi draf dan Penulis akan melihat catatan Anda saat membukanya."
        confirmLabel="Kembalikan"
        pending={actionMutation.isPending}
        initialFocusId="catatan-pengembalian"
        onConfirm={() => void confirmReturn()}
        onClose={() => setDialog(null)}
      >
        <TextArea
          id="catatan-pengembalian"
          name="note"
          label="Catatan perbaikan"
          placeholder="Mis. Tambahkan sumber data pada paragraf kedua."
          value={returnNote}
          onChange={(value) => {
            setReturnNote(value);
            setReturnNoteError(null);
          }}
          status={returnNoteError ? 'error' : 'neutral'}
          statusMessage={returnNoteError ?? undefined}
          aria-invalid={returnNoteError ? true : undefined}
          maxLength={1000}
          showCharCount
          minRows={3}
          required
        />
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === 'unpublish'}
        title="Batalkan penerbitan?"
        description="Artikel tidak lagi tampil di situs dan kembali menjadi draf. Tanggal terbit pertama tetap disimpan."
        confirmLabel="Batalkan terbit"
        destructive
        pending={actionMutation.isPending}
        onConfirm={() => void runAction('unpublish').then((ok) => ok && setDialog(null))}
        onClose={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === 'delete'}
        title="Pindahkan ke sampah?"
        description="Artikel tidak tampil di situs. Admin masih dapat memulihkannya dari Sampah."
        confirmLabel="Pindahkan ke sampah"
        destructive
        pending={deleteMutation.isPending}
        onConfirm={() => void remove(false)}
        onClose={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === 'forceDelete'}
        title="Hapus permanen?"
        description="Artikel akan dihapus selamanya dan tidak dapat dipulihkan."
        confirmLabel="Hapus permanen"
        destructive
        pending={deleteMutation.isPending}
        onConfirm={() => void remove(true)}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}
