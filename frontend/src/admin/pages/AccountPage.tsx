import { useRef, useState, type FormEvent } from 'react';
import { Alert, Button, PasswordInput, useToast } from '@idds/react';
import { usePageMeta } from '../../lib/seo';
import { ApiError } from '../../services/api';
import { useChangePassword, type PasswordChange } from '../account/api';
import { useAuthenticatedUser } from '../auth';
import { PASSWORD_HINT, validateNewPassword } from '../account/password';

type Field = keyof PasswordChange;
type FieldErrors = Partial<Record<Field, string>>;

const fieldOrder: Field[] = ['current_password', 'password', 'password_confirmation'];

function validate(values: PasswordChange): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.current_password) errors.current_password = 'Kata sandi saat ini wajib diisi';
  const password = validateNewPassword(values.password);
  if (password) errors.password = password;
  else if (values.password === values.current_password) {
    errors.password = 'Kata sandi baru harus berbeda dari yang sekarang';
  }
  if (values.password_confirmation !== values.password) {
    errors.password_confirmation = 'Konfirmasi tidak sama dengan kata sandi baru';
  }
  return errors;
}

/**
 * Akun sendiri: ganti kata sandi. Bila akun baru dibuat atau kata sandinya diatur ulang Admin,
 * halaman ini satu-satunya yang bisa dibuka sampai kata sandi sementara diganti.
 */
export default function AccountPage() {
  usePageMeta({ title: 'Akun saya', noindex: true });

  const user = useAuthenticatedUser();
  const { toast } = useToast();
  const change = useChangePassword();
  const formRef = useRef<HTMLFormElement>(null);

  const empty: PasswordChange = { current_password: '', password: '', password_confirmation: '' };
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const focus = (field: Field) =>
    formRef.current?.querySelector<HTMLInputElement>(`[name="${field}"]`)?.focus();

  const update = (field: Field) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const nextErrors = validate(values);
    setErrors(nextErrors);
    const first = fieldOrder.find((field) => nextErrors[field]);
    if (first) return focus(first);

    change.mutate(values, {
      onSuccess: () => {
        setValues(empty);
        toast({
          title: 'Kata sandi diganti',
          description: 'Sesi Anda di perangkat lain telah berakhir.',
          state: 'positive',
          duration: 5000,
        });
      },
      onError: (error) => {
        if (error instanceof ApiError && error.status === 422) {
          const mapped: FieldErrors = {};
          for (const field of fieldOrder) {
            if (error.fieldErrors[field]) mapped[field] = error.fieldErrors[field];
          }
          setErrors(mapped);
          const firstServer = fieldOrder.find((field) => mapped[field]);
          if (firstServer) return focus(firstServer);
        }
        setFormError(error.message);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-h5 font-semibold">Akun saya</h1>
        <p className="text-caption text-content-secondary">
          {user.name} · {user.email} · {user.role_label}
        </p>
      </div>

      {user.must_change_password && (
        <Alert
          variant="caution"
          title="Ganti kata sandi sementara Anda"
          message="Kata sandi Anda dibuat atau diatur ulang oleh Admin. Ganti dengan kata sandi yang hanya Anda ketahui sebelum memakai panel ini."
        />
      )}
      {formError && <Alert variant="critical" message={formError} />}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        noValidate
        aria-labelledby="judul-ganti-sandi"
        className="max-w-xl space-y-5 rounded-xl border border-stroke-primary bg-background-primary p-4 sm:p-6"
      >
        <h2 id="judul-ganti-sandi" className="text-body-sm font-semibold">
          Ganti kata sandi
        </h2>
        <PasswordInput
          id="akun-sandi-sekarang"
          name="current_password"
          label="Kata sandi saat ini"
          autoComplete="current-password"
          value={values.current_password}
          onChange={update('current_password')}
          status={errors.current_password ? 'error' : 'neutral'}
          statusMessage={errors.current_password}
          aria-invalid={errors.current_password ? true : undefined}
          required
        />
        <PasswordInput
          id="akun-sandi-baru"
          name="password"
          label="Kata sandi baru"
          helperText={PASSWORD_HINT}
          autoComplete="new-password"
          value={values.password}
          onChange={update('password')}
          status={errors.password ? 'error' : 'neutral'}
          statusMessage={errors.password}
          aria-invalid={errors.password ? true : undefined}
          required
        />
        <PasswordInput
          id="akun-sandi-ulang"
          name="password_confirmation"
          label="Ulangi kata sandi baru"
          autoComplete="new-password"
          value={values.password_confirmation}
          onChange={update('password_confirmation')}
          status={errors.password_confirmation ? 'error' : 'neutral'}
          statusMessage={errors.password_confirmation}
          aria-invalid={errors.password_confirmation ? true : undefined}
          required
        />
        <Button type="submit" disabled={change.isPending} aria-busy={change.isPending}>
          {change.isPending ? 'Menyimpan…' : 'Ganti kata sandi'}
        </Button>
      </form>
    </div>
  );
}
