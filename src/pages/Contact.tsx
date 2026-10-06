import { useRef, useState, type FormEvent } from 'react';
import { Button, PhoneInput, TextArea, TextField, useToast } from '@idds/react';
import { usePageTitle } from '../lib/router';
import {
  MESSAGE_MAX_LENGTH,
  validateEmail,
  validateMessage,
  validateName,
  validateOptionalPhone,
  validateSubject,
  type ValidationResult,
} from '../lib/validators';
import { sendContactMessage, type ContactMessage } from '../services/contact';

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
  usePageTitle('Hubungi kami');
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const [values, setValues] = useState<ContactMessage>(emptyValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  // Validasi per field baru aktif setelah percobaan kirim pertama.
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const hasValue = (field: FieldName) =>
    field === 'phone'
      ? values.phone.replace(/\D/g, '').length > 3
      : values[field].trim().length > 0;

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

    const firstInvalid = fieldOrder.find((field) => nextErrors[field]);
    if (firstInvalid) {
      formRef.current
        ?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)
        ?.focus();
      return;
    }

    setIsSending(true);
    try {
      const result = await sendContactMessage(values);
      if (result === 'sent') {
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
      } else {
        toast({
          title: 'Formulir belum terhubung ke server',
          description: 'Pesan Anda belum dikirim karena penerima pesan belum dikonfigurasi.',
          state: 'default',
          duration: 6000,
          position: 'top-right',
        });
      }
    } catch {
      toast({
        title: 'Pesan gagal dikirim',
        description: 'Periksa koneksi internet Anda lalu coba lagi.',
        state: 'destructive',
        duration: 5000,
        position: 'top-right',
      });
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

        <Button type="submit" hierarchy="primary" size="lg" className="w-full" disabled={isSending}>
          {isSending ? 'Mengirim…' : 'Kirim pesan'}
        </Button>
      </form>
    </div>
  );
}
