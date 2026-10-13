import { useState, type FormEvent } from 'react';
import { Alert, Button, TextField, useToast } from '@idds/react';
import { IconArrowLeft, IconRefresh } from '@tabler/icons-react';
import ButtonLink from '../../components/ButtonLink';
import EmptyState from '../../components/EmptyState';
import { formatDateTime } from '../../lib/format';
import { Link, navigate, paths } from '../../lib/router';
import { usePageMeta } from '../../lib/seo';
import { validateEmail, validateName } from '../../lib/validators';
import { ApiError } from '../../services/api';
import { useAuthenticatedUser, type AdminRole } from '../auth';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadError from '../components/LoadError';
import SelectField from '../components/SelectField';
import { PASSWORD_HINT, generatePassword, validateNewPassword } from '../password';
import {
  useCreateUser,
  useResetPassword,
  useUpdateUser,
  useUser,
  type ManagedUser,
} from '../users/api';

type Field = 'name' | 'email' | 'role' | 'is_active' | 'password';
type FieldErrors = Partial<Record<Field, string>>;

const ROLE_OPTIONS = [
  { value: 'penulis', label: 'Penulis' },
  { value: 'admin', label: 'Admin' },
];
const STATUS_OPTIONS = [
  { value: 'aktif', label: 'Aktif' },
  { value: 'nonaktif', label: 'Nonaktif' },
];
const ROLE_HELP =
  'Admin menerbitkan artikel dan mengelola pengguna serta pengaturan. Penulis menulis artikel dan mengajukannya untuk ditinjau.';

interface Values {
  name: string;
  email: string;
  role: AdminRole;
  active: boolean;
  password: string;
}

const fieldOrder: Field[] = ['name', 'email', 'role', 'is_active', 'password'];
const fieldIds: Record<Field, string> = {
  name: 'pengguna-nama',
  email: 'pengguna-email',
  role: 'pengguna-peran',
  is_active: 'pengguna-status',
  password: 'pengguna-sandi',
};

function validate(values: Values, creating: boolean): FieldErrors {
  const errors: FieldErrors = {};
  const name = validateName(values.name);
  if (!name.isValid) errors.name = name.message;
  const email = validateEmail(values.email);
  if (!email.isValid) errors.email = email.message;
  if (creating) {
    const password = validateNewPassword(values.password);
    if (password) errors.password = password;
  }
  return errors;
}

function focusField(field: Field) {
  document.getElementById(fieldIds[field])?.focus();
}

/** Tambah pengguna (/admin/pengguna/baru) atau ubah pengguna (/admin/pengguna/:id). */
export default function UserFormPage({ userId }: { userId: number | null }) {
  const user = useUser(userId);
  if (userId === null) return <UserForm key="baru" managed={null} />;

  if (user.isPending) {
    return (
      <p role="status" className="text-caption text-content-secondary">
        Memuat pengguna…
      </p>
    );
  }
  if (user.isError) {
    return user.error instanceof ApiError && user.error.status === 404 ? (
      <EmptyState
        title="Pengguna tidak ditemukan"
        description="Akun ini tidak ada."
        action={<ButtonLink to={paths.adminUsers}>Kembali ke daftar pengguna</ButtonLink>}
      />
    ) : (
      <LoadError
        title="Pengguna gagal dimuat"
        message={user.error.message}
        onRetry={() => void user.refetch()}
      />
    );
  }
  return <UserForm key={user.data.id} managed={user.data} />;
}

function UserForm({ managed }: { managed: ManagedUser | null }) {
  const creating = managed === null;
  usePageMeta({ title: creating ? 'Tambah pengguna' : `Pengguna: ${managed.name}`, noindex: true });

  const me = useAuthenticatedUser();
  const { toast } = useToast();
  const create = useCreateUser();
  const update = useUpdateUser(managed?.id ?? 0);
  const reset = useResetPassword(managed?.id ?? 0);
  const isSelf = managed?.id === me.id;

  const [values, setValues] = useState<Values>({
    name: managed?.name ?? '',
    email: managed?.email ?? '',
    role: managed?.role ?? 'penulis',
    active: managed?.is_active ?? true,
    password: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);

  const change = <K extends keyof Values>(field: K, value: Values[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    const key = field === 'active' ? 'is_active' : (field as Field);
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleError = (error: unknown) => {
    if (
      error instanceof ApiError &&
      error.status === 422 &&
      Object.keys(error.fieldErrors).length
    ) {
      const mapped: FieldErrors = {};
      for (const field of fieldOrder) {
        if (error.fieldErrors[field]) mapped[field] = error.fieldErrors[field];
      }
      setErrors(mapped);
      const first = fieldOrder.find((field) => mapped[field]);
      if (first) return focusField(first);
    }
    setFormError(error instanceof Error ? error.message : 'Terjadi kesalahan.');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const nextErrors = validate(values, creating);
    setErrors(nextErrors);
    const first = fieldOrder.find((field) => nextErrors[field]);
    if (first) return focusField(first);

    const input = {
      name: values.name.trim(),
      email: values.email.trim(),
      role: values.role,
    };
    try {
      if (creating) {
        const created = await create.mutateAsync({ ...input, password: values.password });
        toast({ title: `Akun ${created.name} dibuat`, state: 'positive', duration: 4000 });
        navigate(paths.adminUser(created.id), { replace: true, force: true });
      } else {
        await update.mutateAsync({ ...input, is_active: values.active });
        toast({ title: 'Perubahan tersimpan', state: 'positive', duration: 4000 });
      }
    } catch (error) {
      handleError(error);
    }
  };

  const confirmReset = async () => {
    const message = validateNewPassword(resetPassword);
    if (message) return setResetError(message);
    try {
      await reset.mutateAsync(resetPassword);
      setResetOpen(false);
      setResetPassword('');
      toast({
        title: 'Kata sandi diatur ulang',
        description: 'Sesi aktif pengguna ini berakhir; ia wajib menggantinya saat masuk.',
        state: 'positive',
        duration: 6000,
      });
    } catch (error) {
      setResetError(error instanceof Error ? error.message : 'Terjadi kesalahan.');
    }
  };

  const pending = create.isPending || update.isPending;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          to={paths.adminUsers}
          className="inline-flex items-center gap-2 rounded text-caption font-medium text-content-secondary hover:text-content-primary"
        >
          <IconArrowLeft size={16} aria-hidden="true" />
          Daftar pengguna
        </Link>
        <h1 className="text-h5 font-semibold">{creating ? 'Tambah pengguna' : managed.name}</h1>
      </div>

      {formError && <Alert variant="critical" message={formError} />}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <form
          onSubmit={(event) => void handleSubmit(event)}
          noValidate
          className="space-y-5 rounded-xl border border-stroke-primary bg-background-primary p-4 sm:p-6"
        >
          <TextField
            id={fieldIds.name}
            name="name"
            label="Nama lengkap"
            value={values.name}
            onChange={(value) => change('name', value)}
            status={errors.name ? 'error' : 'neutral'}
            statusMessage={errors.name}
            aria-invalid={errors.name ? true : undefined}
            maxLength={255}
            autoComplete="off"
            required
          />
          <TextField
            id={fieldIds.email}
            name="email"
            type="email"
            label="Email"
            helperText="Dipakai untuk masuk. Tidak boleh sama dengan akun lain."
            value={values.email}
            onChange={(value) => change('email', value)}
            status={errors.email ? 'error' : 'neutral'}
            statusMessage={errors.email}
            aria-invalid={errors.email ? true : undefined}
            maxLength={255}
            autoComplete="off"
            required
          />
          <SelectField
            id={fieldIds.role}
            label="Peran"
            value={values.role}
            onValueChange={(value) => change('role', value as AdminRole)}
            options={ROLE_OPTIONS}
            helperText={isSelf ? 'Anda tidak dapat mengubah peran akun Anda sendiri.' : ROLE_HELP}
            error={errors.role}
            disabled={isSelf}
          />
          {!creating && (
            <SelectField
              id={fieldIds.is_active}
              label="Status akun"
              value={values.active ? 'aktif' : 'nonaktif'}
              onValueChange={(value) => change('active', value === 'aktif')}
              options={STATUS_OPTIONS}
              helperText={
                isSelf
                  ? 'Anda tidak dapat menonaktifkan akun Anda sendiri.'
                  : 'Akun nonaktif tidak dapat masuk, dan sesinya yang sedang berjalan langsung berakhir.'
              }
              error={errors.is_active}
              disabled={isSelf}
            />
          )}
          {creating && (
            <div className="space-y-2">
              <TextField
                id={fieldIds.password}
                name="password"
                label="Kata sandi sementara"
                helperText={`${PASSWORD_HINT} Sampaikan kepada pengguna; ia wajib menggantinya saat pertama kali masuk.`}
                value={values.password}
                onChange={(value) => change('password', value)}
                status={errors.password ? 'error' : 'neutral'}
                statusMessage={errors.password}
                aria-invalid={errors.password ? true : undefined}
                maxLength={255}
                autoComplete="off"
                spellCheck={false}
                required
              />
              <Button
                type="button"
                hierarchy="tertiary"
                prefixIcon={<IconRefresh size={16} aria-hidden="true" />}
                onClick={() => change('password', generatePassword())}
              >
                Buat kata sandi acak
              </Button>
            </div>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <ButtonLink to={paths.adminUsers} hierarchy="secondary">
              Batal
            </ButtonLink>
            <Button type="submit" disabled={pending} aria-busy={pending}>
              {pending ? 'Menyimpan…' : creating ? 'Buat akun' : 'Simpan perubahan'}
            </Button>
          </div>
        </form>

        {!creating && (
          <aside aria-label="Informasi akun" className="space-y-4 lg:self-start">
            <dl className="space-y-2 rounded-xl border border-stroke-primary bg-background-primary p-4 text-caption">
              <div className="flex justify-between gap-2">
                <dt className="text-content-secondary">Terakhir masuk</dt>
                <dd className="text-right">
                  {managed.last_login_at ? formatDateTime(managed.last_login_at) : 'Belum pernah'}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-content-secondary">Artikel ditulis</dt>
                <dd>{managed.articles_count}</dd>
              </div>
              {managed.must_change_password && (
                <p className="text-caption-sm text-content-secondary">
                  Pengguna belum mengganti kata sandi sementaranya.
                </p>
              )}
            </dl>
            <div className="space-y-2 rounded-xl border border-stroke-primary bg-background-primary p-4">
              <h2 className="text-caption font-semibold">Kata sandi</h2>
              <p className="text-caption-sm text-content-secondary">
                CMS tidak mengirim email. Atur kata sandi sementara baru lalu sampaikan langsung
                kepada pengguna.
              </p>
              <Button
                type="button"
                hierarchy="secondary"
                className="w-full"
                disabled={isSelf}
                aria-describedby={isSelf ? 'sandi-sendiri' : undefined}
                onClick={() => {
                  setResetPassword(generatePassword());
                  setResetError(null);
                  setResetOpen(true);
                }}
              >
                Atur ulang kata sandi
              </Button>
              {isSelf && (
                <p id="sandi-sendiri" className="text-caption-sm text-content-secondary">
                  Ganti kata sandi Anda sendiri di menu{' '}
                  <Link to={paths.adminAccount} className="text-primary-600 underline">
                    Akun saya
                  </Link>
                  .
                </p>
              )}
            </div>
          </aside>
        )}
      </div>

      <ConfirmDialog
        open={resetOpen}
        title="Atur ulang kata sandi?"
        description="Sesi pengguna ini yang sedang berjalan berakhir, dan ia wajib mengganti kata sandi sementara ini saat masuk."
        confirmLabel="Atur ulang"
        pending={reset.isPending}
        initialFocusId="sandi-baru"
        onConfirm={() => void confirmReset()}
        onClose={() => setResetOpen(false)}
      >
        <TextField
          id="sandi-baru"
          name="password"
          label="Kata sandi sementara baru"
          helperText={PASSWORD_HINT}
          value={resetPassword}
          onChange={(value) => {
            setResetPassword(value);
            setResetError(null);
          }}
          status={resetError ? 'error' : 'neutral'}
          statusMessage={resetError ?? undefined}
          aria-invalid={resetError ? true : undefined}
          maxLength={255}
          autoComplete="off"
          spellCheck={false}
          required
        />
      </ConfirmDialog>
    </div>
  );
}
