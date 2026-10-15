import { useRef, useState, type FormEvent } from 'react';
import { Button, PhoneInput, TextArea, TextField, useToast } from '@idds/react';
import { useQuery } from '@tanstack/react-query';
import { paths } from '../lib/router';
import { usePageMeta } from '../lib/seo';
import {
  EMAIL_MAX_LENGTH,
  MESSAGE_MAX_LENGTH,
  NAME_MAX_LENGTH,
  SUBJECT_MAX_LENGTH,
  isEmptyPhone,
  validateEmail,
  validateMessage,
  validateName,
  validateOptionalPhone,
  validateSubject,
  type ValidationResult,
} from '../lib/validators';
import { ApiError } from '../services/api';
import {
  HONEYPOT_FIELD,
  fetchContactToken,
  sendContactMessage,
  type ContactMessage,
} from '../services/contact';

type FieldName = keyof ContactMessage;
type FieldErrors = Partial<Record<FieldName, string>>;

const fieldOrder: FieldName[] = ['name', 'email', 'phone', 'subject', 'message'];

const validators: Record<FieldName, (value: string) => ValidationResult> = {
  name: validateName,
  email: validateEmail,
  phone: validateOptionalPhone,
  subject: validateSubject,
  message: validateMessage,
};

const emptyValues: ContactMessage = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};

export default function Contact() {
  usePageMeta({
    title: 'Hubungi kami',
    description: 'Sampaikan pertanyaan, masukan, atau ajakan kolaborasi Anda kepada tim PEMDI.',
    path: paths.contact,
  });
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const [values, setValues] = useState<ContactMessage>(emptyValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  // Validasi per field baru aktif setelah percobaan kirim pertama.
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  // Token waktu dari server (jebakan bot); diambil saat formulir dibuka, berlaku 2 jam.
  const token = useQuery({
    queryKey: ['contact-token'],
    queryFn: ({ signal }) => fetchContactToken(signal),
    staleTime: 60 * 60_000,
  });

  const hasValue = (field: FieldName) =>
    field === 'phone' ? !isEmptyPhone(values.phone) : values[field].trim().length > 0;

  const statusOf = (field: FieldName) => {
    if (errors[field]) return 'error' as const;
    if (submitted && hasValue(field)) return 'success' as const;
    return 'neutral' as const;
  };

  const setField = (field: FieldName) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (submitted) {
      setErrors((current) => ({
        ...current,
        [field]: validators[field](value).message || undefined,
      }));
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);

    const nextErrors: FieldErrors = {};
    for (const field of fieldOrder) {
      const result = validators[field](values[field]);
      if (!result.isValid) nextErrors[field] = result.message;
    }
    setErrors(nextErrors);

    const focusFirst = (fieldErrors: FieldErrors) => {
      const first = fieldOrder.find((field) => fieldErrors[field]);
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return Boolean(first);
    };
    if (focusFirst(nextErrors)) return;

    setIsSending(true);
    try {
      const formToken = token.data ?? (await token.refetch({ throwOnError: true })).data;
      if (!formToken) throw new ApiError(0, 'Token formulir tidak tersedia.');
      await sendContactMessage(
        {
          ...values,
          // Hanya kode negara (mis. "+62") berarti tidak ada nomor.
          phone: isEmptyPhone(values.phone) ? '' : values.phone,
        },
        { token: formToken, honeypot },
      );
      toast({
        title: 'Pesan terkirim',
        description: 'Terima kasih, pesan Anda telah kami terima.',
        state: 'positive',
        duration: 4000,
        position: 'top-right',
      });
      setValues(emptyValues);
      setErrors({});
      setSubmitted(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        // Aturan server sama dengan validators.ts; galat per kolom biasanya sudah tertangkap di
        // browser, kecuali token formulir yang kedaluwarsa (formulir dibiarkan terbuka lama).
        const serverErrors: FieldErrors = {};
        for (const field of fieldOrder) {
          if (error.fieldErrors[field]) serverErrors[field] = error.fieldErrors[field];
        }
        setErrors(serverErrors);
        if (!focusFirst(serverErrors)) {
          void token.refetch();
          toast({
            title: 'Formulir perlu dimuat ulang',
            description: error.fieldErrors.token ?? error.message,
            state: 'destructive',
            duration: 6000,
            position: 'top-right',
          });
        }
      } else {
        toast({
          title: 'Pesan gagal dikirim',
          description:
            error instanceof ApiError && error.status === 429
              ? 'Terlalu banyak pesan dari jaringan Anda. Coba lagi beberapa menit lagi.'
              : 'Periksa koneksi internet Anda lalu coba lagi.',
          state: 'destructive',
          duration: 5000,
          position: 'top-right',
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1240px] px-5 py-8 sm:px-6 lg:px-8 lg:py-12">
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        noValidate
        aria-labelledby="judul-kontak"
        className="mx-auto flex w-full max-w-[640px] flex-col gap-6 rounded-xl border border-stroke-primary bg-background-primary p-5 shadow-sm md:p-8"
      >
        <div className="space-y-2">
          <h1 id="judul-kontak" className="text-h5 font-bold text-content-primary lg:text-h4">
            Hubungi kami
          </h1>
          <p className="text-body-sm text-content-secondary">
            Sampaikan pertanyaan, masukan, atau ajakan kolaborasi Anda kepada tim PEMDI.
          </p>
        </div>

        <TextField
          label="Nama lengkap"
          name="name"
          autoComplete="name"
          value={values.name}
          onChange={setField('name')}
          placeholder="Masukkan nama lengkap Anda"
          maxLength={NAME_MAX_LENGTH}
          required
          status={statusOf('name')}
          statusMessage={errors.name}
        />

        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={setField('email')}
          placeholder="nama@instansi.go.id"
          maxLength={EMAIL_MAX_LENGTH}
          required
          status={statusOf('email')}
          statusMessage={errors.email}
        />

        <PhoneInput
          label="Nomor ponsel (opsional)"
          name="phone"
          value={values.phone}
          onChange={setField('phone')}
          placeholder="878-8668-3355"
          status={statusOf('phone')}
          statusMessage={errors.phone}
          helperText="Digunakan hanya bila kami perlu menghubungi Anda."
        />

        <TextField
          label="Subjek"
          name="subject"
          value={values.subject}
          onChange={setField('subject')}
          placeholder="Contoh: Kolaborasi program"
          maxLength={SUBJECT_MAX_LENGTH}
          required
          status={statusOf('subject')}
          statusMessage={errors.subject}
        />

        <TextArea
          label="Pesan"
          name="message"
          value={values.message}
          onChange={setField('message')}
          placeholder="Tulis pesan Anda di sini"
          required
          maxLength={MESSAGE_MAX_LENGTH}
          showCharCount
          minRows={5}
          status={statusOf('message')}
          statusMessage={errors.message}
        />

        {/* Jebakan bot: tidak terlihat dan tidak dapat dicapai keyboard maupun pembaca layar. */}
        <div
          aria-hidden="true"
          className="absolute -left-[10000px] top-auto size-px overflow-hidden"
        >
          <label htmlFor="kontak-kolom-khusus">Jangan isi kolom ini</label>
          <input
            id="kontak-kolom-khusus"
            type="text"
            name={HONEYPOT_FIELD}
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <Button type="submit" hierarchy="primary" size="lg" className="w-full" disabled={isSending}>
          {isSending ? 'Mengirim…' : 'Kirim pesan'}
        </Button>
      </form>
    </div>
  );
}
