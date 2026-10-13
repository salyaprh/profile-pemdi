import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Alert, Button, PasswordInput, TextField } from '@idds/react';
import { IconArrowLeft } from '@tabler/icons-react';
import { siteName } from '../../data/siteContent';
import { Link, navigate, paths, useLocation } from '../../lib/router';
import { usePageMeta } from '../../lib/seo';
import { validateEmail } from '../../lib/validators';
import { ApiError } from '../../services/api';
import { useCurrentUser, useLogin, type LoginCredentials } from '../auth';
import { safeReturnPath } from '../navigation';

type FieldErrors = Partial<Record<keyof LoginCredentials, string>>;

function validate({ email, password }: LoginCredentials): FieldErrors {
  const errors: FieldErrors = {};
  const emailResult = validateEmail(email);
  if (!emailResult.isValid) errors.email = emailResult.message;
  if (!password) errors.password = 'Kata sandi wajib diisi';
  return errors;
}

/**
 * Pola Login IDDS: logo, judul, deskripsi singkat, form dengan pesan error spesifik, dan
 * tombol "Masuk". Tidak ada pendaftaran publik: akun dibuat oleh Admin.
 */
export default function LoginPage() {
  usePageMeta({ title: 'Masuk ke CMS', noindex: true });

  const { searchParams } = useLocation();
  const returnTo = safeReturnPath(searchParams.get('kembali'));
  const { data: user } = useCurrentUser();
  const login = useLogin();

  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<LoginCredentials>({ email: '', password: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Sudah login (termasuk tepat setelah berhasil masuk): lanjut ke tujuan.
  useEffect(() => {
    if (user) navigate(returnTo, { replace: true });
  }, [user, returnTo]);

  const update = (field: keyof LoginCredentials) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const credentials = { email: values.email.trim(), password: values.password };
    const nextErrors = validate(credentials);
    setErrors(nextErrors);

    const firstInvalid = (['email', 'password'] as const).find((field) => nextErrors[field]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLInputElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    login.mutate(credentials, {
      onError: (error) => {
        // Format kolom sudah dicek di browser, jadi galat dari server menyangkut login itu sendiri
        // (kredensial salah, akun nonaktif, terlalu banyak percobaan): tampilkan di atas form.
        const message =
          error instanceof ApiError
            ? (error.fieldErrors.email ?? error.fieldErrors.password ?? error.message)
            : error.message;
        setFormError(message);
      },
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background-secondary px-4 py-10">
      <main className="w-full max-w-[420px]">
        <div className="rounded-2xl border border-stroke-primary bg-background-primary p-6 shadow-sm sm:p-8">
          <div className="mb-6 space-y-4">
            <img src="/panrb.svg" alt={siteName} className="h-12 w-auto" />
            <div className="space-y-1">
              <h1 className="text-h5 font-semibold text-content-primary">Masuk ke CMS</h1>
              <p className="text-caption text-content-secondary">
                Kelola konten situs {siteName}. Khusus pengelola yang sudah memiliki akun.
              </p>
            </div>
          </div>

          {formError && (
            // Alert IDDS sudah ber-role="alert" (dibacakan pembaca layar saat muncul).
            <div className="mb-5">
              <Alert variant="critical" message={formError} />
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-5">
            <TextField
              id="login-email"
              name="email"
              type="email"
              label="Email"
              placeholder="nama@instansi.go.id"
              autoComplete="username"
              inputMode="email"
              value={values.email}
              onChange={update('email')}
              status={errors.email ? 'error' : 'neutral'}
              aria-invalid={errors.email ? true : undefined}
              statusMessage={errors.email}
              required
            />
            <div className="space-y-2">
              <PasswordInput
                id="login-password"
                name="password"
                label="Kata sandi"
                placeholder="Masukkan kata sandi"
                autoComplete="current-password"
                value={values.password}
                onChange={update('password')}
                status={errors.password ? 'error' : 'neutral'}
                aria-invalid={errors.password ? true : undefined}
                statusMessage={errors.password}
                required
              />
              <p className="text-caption-sm text-content-secondary">
                Lupa kata sandi? Hubungi Admin CMS untuk mengatur ulang.
              </p>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={login.isPending}
              aria-busy={login.isPending}
            >
              {login.isPending ? 'Memproses…' : 'Masuk'}
            </Button>
          </form>
        </div>

        <Link
          to={paths.home}
          className="mx-auto mt-6 flex w-fit items-center gap-2 rounded text-caption font-medium text-content-secondary hover:text-content-primary"
        >
          <IconArrowLeft size={16} aria-hidden="true" />
          Kembali ke situs
        </Link>
      </main>
    </div>
  );
}
