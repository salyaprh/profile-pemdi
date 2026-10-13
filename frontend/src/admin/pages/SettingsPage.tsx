import { useRef, useState, type FormEvent } from 'react';
import { Alert, Button, TextArea, TextField, useToast } from '@idds/react';
import { usePageMeta } from '../../lib/seo';
import { validateEmail } from '../../lib/validators';
import { ApiError } from '../../services/api';
import type { SiteSettings } from '../../services/content';
import LoadError from '../components/LoadError';
import { useSaveSettings, useSettings } from '../settings/api';
import { useUnsavedChangesGuard } from '../useUnsavedChangesGuard';

/** Bentuk isian formulir: semua teks (kolom kosong dikirim sebagai null). */
interface FormValues {
  description: string;
  stats: { value: string; label: string }[];
  email: string;
  phone: string;
  address: string;
  facebook: string;
  instagram: string;
  x: string;
  youtube: string;
}

type Errors = Record<string, string>;

const SOCIALS = [
  { key: 'facebook', label: 'Facebook', placeholder: 'https://www.facebook.com/…' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://www.instagram.com/…' },
  { key: 'x', label: 'X (Twitter)', placeholder: 'https://x.com/…' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://www.youtube.com/@…' },
] as const;

const toValues = (settings: SiteSettings): FormValues => ({
  description: settings.description,
  stats: settings.hero_stats.map(({ value, label }) => ({ value, label })),
  email: settings.contact.email ?? '',
  phone: settings.contact.phone ?? '',
  address: settings.contact.address ?? '',
  facebook: settings.social.facebook ?? '',
  instagram: settings.social.instagram ?? '',
  x: settings.social.x ?? '',
  youtube: settings.social.youtube ?? '',
});

const orNull = (value: string) => value.trim() || null;

const toSettings = (values: FormValues): SiteSettings => ({
  description: values.description.trim(),
  hero_stats: values.stats.map(({ value, label }) => ({
    value: value.trim(),
    label: label.trim(),
  })),
  contact: {
    email: orNull(values.email),
    phone: orNull(values.phone),
    address: orNull(values.address),
  },
  social: {
    facebook: orNull(values.facebook),
    instagram: orNull(values.instagram),
    x: orNull(values.x),
    youtube: orNull(values.youtube),
  },
});

const same = (a: FormValues, b: FormValues) => JSON.stringify(a) === JSON.stringify(b);

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

/** Aturan yang sama dengan App\Http\Requests\SiteSettingsRequest. */
function validate(values: FormValues): Errors {
  const errors: Errors = {};
  const description = values.description.trim();
  if (description.length < 20) errors.description = 'Deskripsi minimal 20 karakter';
  values.stats.forEach((stat, index) => {
    if (!stat.value.trim()) errors[`stats.${index}.value`] = 'Angka wajib diisi';
    if (!stat.label.trim()) errors[`stats.${index}.label`] = 'Keterangan wajib diisi';
  });
  if (values.email.trim() && !validateEmail(values.email).isValid) {
    errors.email = 'Format email tidak valid';
  }
  if (values.phone.trim() && !/^\+?[\d\s().-]{6,30}$/.test(values.phone.trim())) {
    errors.phone = 'Nomor telepon hanya boleh berisi angka, spasi, +, -, titik, dan kurung';
  }
  for (const { key } of SOCIALS) {
    const value = values[key].trim();
    if (value && !isHttpsUrl(value)) errors[key] = 'Gunakan alamat lengkap yang diawali https://';
  }
  return errors;
}

/** Nama kolom di respons 422 Laravel (hero_stats.0.value) -> kunci isian formulir. */
function toFormKey(serverKey: string): string {
  const stat = serverKey.match(/^hero_stats\.(\d+)\.(value|label)$/);
  if (stat) return `stats.${stat[1]}.${stat[2]}`;
  return serverKey.replace(/^(contact|social)\./, '');
}

/** Pengaturan situs (khusus Admin): teks dan angka yang tampil di situs publik. */
export default function SettingsPage() {
  usePageMeta({ title: 'Pengaturan', noindex: true });
  const settings = useSettings();

  if (settings.isPending) {
    return (
      <p role="status" className="text-caption text-content-secondary">
        Memuat pengaturan…
      </p>
    );
  }
  if (settings.isError) {
    return (
      <LoadError
        title="Pengaturan gagal dimuat"
        message={settings.error.message}
        onRetry={() => void settings.refetch()}
      />
    );
  }
  return <SettingsForm initial={settings.data} />;
}

function SettingsForm({ initial }: { initial: SiteSettings }) {
  const { toast } = useToast();
  const save = useSaveSettings();
  const formRef = useRef<HTMLFormElement>(null);
  const [baseline, setBaseline] = useState(() => toValues(initial));
  const [values, setValues] = useState(baseline);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const dirty = !same(values, baseline);
  useUnsavedChangesGuard(dirty);

  const clearError = (key: string) =>
    setErrors((current) => Object.fromEntries(Object.entries(current).filter(([k]) => k !== key)));
  const setField = (key: keyof Omit<FormValues, 'stats'>) => (value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    clearError(key);
  };
  const setStat = (index: number, field: 'value' | 'label') => (value: string) => {
    setValues((current) => ({
      ...current,
      stats: current.stats.map((stat, i) => (i === index ? { ...stat, [field]: value } : stat)),
    }));
    clearError(`stats.${index}.${field}`);
  };

  // Dicari di dalam formulir: <meta name="description"> di <head> juga memakai atribut name itu.
  const focusFirst = (found: Errors) => {
    const selector = Object.keys(found)
      .map((key) => `[name="${key}"]`)
      .join(',');
    formRef.current?.querySelector<HTMLElement>(selector)?.focus();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) return focusFirst(found);

    save.mutate(toSettings(values), {
      onSuccess: (saved) => {
        const next = toValues(saved);
        setBaseline(next);
        setValues(next);
        toast({ title: 'Pengaturan tersimpan', state: 'positive', duration: 4000 });
      },
      onError: (error) => {
        if (error instanceof ApiError && error.status === 422) {
          const mapped: Errors = {};
          for (const [key, message] of Object.entries(error.fieldErrors)) {
            mapped[toFormKey(key)] = message;
          }
          setErrors(mapped);
          if (Object.keys(mapped).length) return focusFirst(mapped);
        }
        setFormError(error.message);
      },
    });
  };

  // Kunci galat sama dengan atribut `name` kolomnya, sehingga fokus bisa dipindah ke kolom bermasalah.
  const fieldProps = (key: string) => ({
    status: errors[key] ? ('error' as const) : ('neutral' as const),
    statusMessage: errors[key],
    'aria-invalid': errors[key] ? true : undefined,
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-h5 font-semibold">Pengaturan situs</h1>
        <p className="text-caption text-content-secondary">
          Teks dan angka yang tampil di beranda dan footer situs publik. Perubahan langsung terlihat
          setelah disimpan.
        </p>
      </div>

      {formError && <Alert variant="critical" message={formError} />}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        noValidate
        className="max-w-3xl space-y-8 rounded-xl border border-stroke-primary bg-background-primary p-4 sm:p-6"
      >
        <section aria-labelledby="judul-umum" className="space-y-5">
          <h2 id="judul-umum" className="text-body-sm font-semibold">
            Umum
          </h2>
          <TextArea
            id="pengaturan-deskripsi"
            name="description"
            label="Deskripsi situs"
            helperText="Tampil di footer dan menjadi deskripsi bawaan hasil pencarian. 20–300 karakter."
            value={values.description}
            onChange={setField('description')}
            maxLength={300}
            showCharCount
            minRows={3}
            required
            {...fieldProps('description')}
          />
        </section>

        <fieldset className="space-y-5">
          <legend className="text-body-sm font-semibold">Angka di beranda</legend>
          <p className="text-caption-sm text-content-secondary">
            Tiga angka ringkas di bawah bagian utama beranda. Isi dengan data resmi, mis. “28”
            dengan keterangan “Layanan terdigitalisasi”.
          </p>
          {values.stats.map((stat, index) => (
            <div key={index} className="grid gap-3 sm:grid-cols-[140px_1fr]">
              <TextField
                id={`pengaturan-angka-${index}`}
                name={`stats.${index}.value`}
                label={`Angka ${index + 1}`}
                value={stat.value}
                onChange={setStat(index, 'value')}
                maxLength={10}
                autoComplete="off"
                required
                {...fieldProps(`stats.${index}.value`)}
              />
              <TextField
                id={`pengaturan-keterangan-${index}`}
                name={`stats.${index}.label`}
                label={`Keterangan ${index + 1}`}
                value={stat.label}
                onChange={setStat(index, 'label')}
                maxLength={60}
                autoComplete="off"
                required
                {...fieldProps(`stats.${index}.label`)}
              />
            </div>
          ))}
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="text-body-sm font-semibold">Kontak</legend>
          <p className="text-caption-sm text-content-secondary">
            Tampil di footer. Kolom yang dikosongkan tidak ditampilkan.
          </p>
          <TextField
            id="pengaturan-email"
            name="email"
            type="email"
            label="Email"
            value={values.email}
            onChange={setField('email')}
            maxLength={254}
            autoComplete="off"
            {...fieldProps('email')}
          />
          <TextField
            id="pengaturan-telepon"
            name="phone"
            type="tel"
            label="Telepon"
            value={values.phone}
            onChange={setField('phone')}
            maxLength={30}
            autoComplete="off"
            {...fieldProps('phone')}
          />
          <TextArea
            id="pengaturan-alamat"
            name="address"
            label="Alamat"
            value={values.address}
            onChange={setField('address')}
            maxLength={300}
            minRows={2}
            {...fieldProps('address')}
          />
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="text-body-sm font-semibold">Media sosial</legend>
          <p className="text-caption-sm text-content-secondary">
            Alamat lengkap akun resmi (harus diawali https://). Yang dikosongkan tidak ditampilkan.
          </p>
          {SOCIALS.map(({ key, label, placeholder }) => (
            <TextField
              key={key}
              id={`pengaturan-${key}`}
              name={key}
              type="url"
              label={label}
              placeholder={placeholder}
              value={values[key]}
              onChange={setField(key)}
              maxLength={255}
              autoComplete="off"
              {...fieldProps(key)}
            />
          ))}
        </fieldset>

        <div className="flex items-center justify-between gap-3">
          <p role="status" className="text-caption-sm text-content-secondary">
            {dirty ? 'Ada perubahan yang belum disimpan.' : ''}
          </p>
          <Button type="submit" disabled={save.isPending || !dirty} aria-busy={save.isPending}>
            {save.isPending ? 'Menyimpan…' : 'Simpan pengaturan'}
          </Button>
        </div>
      </form>
    </div>
  );
}
