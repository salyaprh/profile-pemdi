import { useState, type FormEvent } from 'react';
import { Alert, Button, TextField, useToast } from '@idds/react';
import { usePageMeta } from '../../lib/seo';
import { ApiError } from '../../services/api';
import { useCategories, useDeleteCategory, useSaveCategory } from '../articles/api';
import type { Category } from '../articles/types';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadError from '../components/LoadError';

function validateName(name: string): string | null {
  if (!name.trim()) return 'Nama kategori wajib diisi';
  if (name.trim().length < 3) return 'Nama kategori minimal 3 karakter';
  return null;
}

const errorMessage = (error: unknown) =>
  error instanceof ApiError ? (error.fieldErrors.name ?? error.message) : 'Terjadi kesalahan.';

/** Kelola kategori artikel (khusus Admin). Kategori yang masih dipakai artikel tidak bisa dihapus. */
export default function CategoriesPage() {
  usePageMeta({ title: 'Kategori', noindex: true });

  const { toast } = useToast();
  const categories = useCategories();
  const save = useSaveCategory();
  const remove = useDeleteCategory();

  const [newName, setNewName] = useState('');
  const [newError, setNewError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: number; name: string; error: string | null } | null>(
    null,
  );
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const error = validateName(newName);
    if (error) {
      setNewError(error);
      document.getElementById('kategori-baru')?.focus();
      return;
    }
    try {
      const created = await save.mutateAsync({ id: null, name: newName.trim() });
      setNewName('');
      toast({ title: `Kategori “${created.name}” ditambahkan`, state: 'positive', duration: 4000 });
    } catch (caught) {
      setNewError(errorMessage(caught));
    }
  };

  const handleRename = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    const error = validateName(editing.name);
    if (error) return setEditing({ ...editing, error });
    try {
      await save.mutateAsync({ id: editing.id, name: editing.name.trim() });
      setEditing(null);
      toast({ title: 'Nama kategori diperbarui', state: 'positive', duration: 4000 });
    } catch (caught) {
      setEditing({ ...editing, error: errorMessage(caught) });
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast({ title: `Kategori “${deleting.name}” dihapus`, state: 'positive', duration: 4000 });
    } catch (caught) {
      setPageError(errorMessage(caught));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-h5 font-semibold">Kategori</h1>
        <p className="text-caption text-content-secondary">
          Kategori mengelompokkan artikel portofolio dan menjadi filter di situs publik.
        </p>
      </div>

      <form
        onSubmit={(event) => void handleCreate(event)}
        noValidate
        className="flex flex-col gap-3 rounded-xl border border-stroke-primary bg-background-primary p-4 sm:flex-row sm:items-start"
      >
        <div className="flex-1">
          <TextField
            id="kategori-baru"
            name="name"
            label="Kategori baru"
            placeholder="Mis. Inovasi Pelayanan"
            value={newName}
            onChange={(value) => {
              setNewName(value);
              setNewError(null);
            }}
            status={newError ? 'error' : 'neutral'}
            statusMessage={newError ?? undefined}
            aria-invalid={newError ? true : undefined}
            maxLength={100}
            autoComplete="off"
          />
        </div>
        <Button type="submit" disabled={save.isPending} className="sm:mt-7">
          Tambah kategori
        </Button>
      </form>

      {pageError && (
        <Alert
          variant="critical"
          message={pageError}
          dismissible
          onDismiss={() => setPageError(null)}
          dismissLabel="Tutup pesan"
        />
      )}

      {categories.isError ? (
        <LoadError
          title="Kategori gagal dimuat"
          message={categories.error.message}
          onRetry={() => void categories.refetch()}
        />
      ) : (
        <div className="rounded-xl border border-stroke-primary bg-background-primary">
          <p role="status" className="sr-only">
            {categories.isPending ? 'Memuat kategori' : `${categories.data.length} kategori`}
          </p>
          <ul className="divide-y divide-stroke-primary">
            {categories.data?.map((category) => (
              <li
                key={category.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                {editing?.id === category.id ? (
                  <form
                    onSubmit={(event) => void handleRename(event)}
                    noValidate
                    className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-start"
                  >
                    <div className="flex-1">
                      <TextField
                        id={`kategori-${category.id}`}
                        name="name"
                        label={`Nama baru untuk ${category.name}`}
                        value={editing.name}
                        onChange={(value) => setEditing({ ...editing, name: value, error: null })}
                        status={editing.error ? 'error' : 'neutral'}
                        statusMessage={editing.error ?? undefined}
                        aria-invalid={editing.error ? true : undefined}
                        maxLength={100}
                        // eslint-disable-next-line jsx-a11y/no-autofocus -- fokus pindah ke isian yang baru dibuka
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2 sm:mt-7">
                      <Button type="submit" size="md" disabled={save.isPending}>
                        Simpan
                      </Button>
                      <Button
                        type="button"
                        size="md"
                        hierarchy="secondary"
                        onClick={() => setEditing(null)}
                      >
                        Batal
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div>
                      <p className="text-body-sm font-semibold">{category.name}</p>
                      <p className="text-caption-sm text-content-secondary">
                        {category.articles_count} artikel · /{category.slug}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        hierarchy="secondary"
                        size="md"
                        onClick={() =>
                          setEditing({ id: category.id, name: category.name, error: null })
                        }
                        aria-label={`Ubah nama kategori ${category.name}`}
                      >
                        Ubah
                      </Button>
                      <Button
                        hierarchy="tertiary"
                        size="md"
                        onClick={() => setDeleting(category)}
                        disabled={category.articles_count > 0}
                        aria-label={`Hapus kategori ${category.name}`}
                        aria-describedby={
                          category.articles_count > 0
                            ? `kategori-${category.id}-dipakai`
                            : undefined
                        }
                      >
                        Hapus
                      </Button>
                      {category.articles_count > 0 && (
                        <span id={`kategori-${category.id}-dipakai`} className="sr-only">
                          Tidak dapat dihapus karena masih dipakai {category.articles_count}{' '}
                          artikel.
                        </span>
                      )}
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Hapus kategori?"
        description={`Kategori “${deleting?.name ?? ''}” akan dihapus.`}
        confirmLabel="Hapus kategori"
        destructive
        pending={remove.isPending}
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
