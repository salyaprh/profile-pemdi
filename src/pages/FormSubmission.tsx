import { useState } from 'react';
import {
  TextField,
  Button,
  PasswordInput,
  PhoneInput,
  ConfirmationProvider,
  ToastProvider,
  useConfirmation,
  useToast,
} from '@idds/react';

// Validation functions
const validateEmail = (
  email: string,
): { isValid: boolean; message: string } => {
  if (!email.trim()) {
    return { isValid: false, message: 'Email wajib diisi' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Format email tidak valid' };
  }
  return { isValid: true, message: '' };
};

const validatePhone = (
  phone: string,
): { isValid: boolean; message: string } => {
  if (!phone.trim()) {
    return { isValid: false, message: 'Nomor ponsel wajib diisi' };
  }
  // Remove spaces, dashes, and plus sign, then check if it's 10-14 digits (allowing for country code)
  const cleanedPhone = phone.replace(/[\s-+]/g, '');
  if (!/^[0-9]{10,15}$/.test(cleanedPhone)) {
    return { isValid: false, message: 'Nomor ponsel harus 10-15 digit angka' };
  }
  return { isValid: true, message: '' };
};

const validatePassword = (
  password: string,
): { isValid: boolean; message: string } => {
  if (!password.trim()) {
    return { isValid: false, message: 'Kata sandi wajib diisi' };
  }
  if (password.length < 8) {
    return { isValid: false, message: 'Minimal 8 karakter' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Harus mengandung huruf besar' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Harus mengandung huruf kecil' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Harus mengandung angka' };
  }
  return { isValid: true, message: '' };
};

function FormContent() {
  const { confirm } = useConfirmation();
  const { toast } = useToast();

  // Form state
  const [name, setName] = useState('Dwi Anjasmara');
  const [phone, setPhone] = useState('+6287886683355');
  const [email, setEmail] = useState('example@email.com');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Validation state - only set after submit attempt
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fieldStatus, setFieldStatus] = useState<
    Record<string, 'neutral' | 'error' | 'success'>
  >({});

  // Handle field change with validation after submit
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (submitted) {
      const validation = validateEmail(value);
      if (validation.isValid) {
        setFieldStatus((prev) => ({ ...prev, email: 'success' }));
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.email;
          return newErrors;
        });
      } else {
        setFieldStatus((prev) => ({ ...prev, email: 'error' }));
        setFieldErrors((prev) => ({ ...prev, email: validation.message }));
      }
    }
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    if (submitted) {
      const validation = validatePhone(value);
      if (validation.isValid) {
        setFieldStatus((prev) => ({ ...prev, phone: 'success' }));
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.phone;
          return newErrors;
        });
      } else {
        setFieldStatus((prev) => ({ ...prev, phone: 'error' }));
        setFieldErrors((prev) => ({ ...prev, phone: validation.message }));
      }
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (submitted) {
      const validation = validatePassword(value);
      if (validation.isValid) {
        setFieldStatus((prev) => ({ ...prev, password: 'success' }));
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.password;
          return newErrors;
        });
      } else {
        setFieldStatus((prev) => ({ ...prev, password: 'error' }));
        setFieldErrors((prev) => ({ ...prev, password: validation.message }));
      }
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (submitted) {
      if (!value.trim()) {
        setFieldStatus((prev) => ({ ...prev, confirmPassword: 'error' }));
        setFieldErrors((prev) => ({
          ...prev,
          confirmPassword: 'Konfirmasi kata sandi wajib diisi',
        }));
      } else if (value !== password) {
        setFieldStatus((prev) => ({ ...prev, confirmPassword: 'error' }));
        setFieldErrors((prev) => ({
          ...prev,
          confirmPassword: 'Kata sandi tidak cocok',
        }));
      } else {
        setFieldStatus((prev) => ({ ...prev, confirmPassword: 'success' }));
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.confirmPassword;
          return newErrors;
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    const errors: Record<string, string> = {};
    const status: Record<string, 'error' | 'success'> = {};

    // Validate name
    if (!name.trim()) {
      errors.name = 'Nama lengkap wajib diisi';
      status.name = 'error';
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.message;
      status.email = 'error';
    } else {
      status.email = 'success';
    }

    // Validate phone
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.message;
      status.phone = 'error';
    } else {
      status.phone = 'success';
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.message;
      status.password = 'error';
    } else {
      status.password = 'success';
    }

    // Validate confirm password
    if (!confirmPassword.trim()) {
      errors.confirmPassword = 'Konfirmasi kata sandi wajib diisi';
      status.confirmPassword = 'error';
    } else if (confirmPassword !== password) {
      errors.confirmPassword = 'Kata sandi tidak cocok';
      status.confirmPassword = 'error';
    } else {
      status.confirmPassword = 'success';
    }

    setFieldErrors(errors);
    setFieldStatus(status);

    // If no errors, submit form
    if (Object.keys(errors).length === 0) {
      console.log('Form submitted:', { name, phone, email, password });

      const isConfirmed = await confirm({
        title: 'Konfirmasi Pendaftaran',
        message: 'Apakah data yang Anda masukkan sudah benar?',
        confirmText: 'Ya, Daftar',
        cancelText: 'Batal',
      });

      if (isConfirmed) {
        toast({
          title: 'Akun Berhasil Dibuat',
          description: 'Selamat, akun Anda telah berhasil didaftarkan.',
          state: 'positive',
          duration: 3000,
          position: 'top-right',
        });
      }
    }
  };

  return (
    <div className="w-full flex justify-center py-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[538px] p-4 md:p-6 xl:p-8 space-y-6 bg-background-primary rounded-lg border border-stroke-primary shadow-sm"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-content-primary mb-2">
            Buat akun Anda
          </h1>
          <p className="text-sm text-content-secondary">
            Masukkan informasi berikut untuk membuat akun.
          </p>
        </div>

        {/* Name */}
        <TextField
          label="Nama Lengkap"
          value={name}
          onChange={setName}
          placeholder="Dwi Anjasmara"
          required
          status={fieldStatus.name || 'neutral'}
          statusMessage={fieldErrors.name}
        />

        {/* Phone with Country Code */}
        <PhoneInput
          label="Nomor Ponsel"
          value={phone}
          onChange={handlePhoneChange}
          placeholder="878-8668-3355"
          status={fieldStatus.phone || 'neutral'}
          statusMessage={fieldErrors.phone}
          helperText="Informasi ini digunakan untuk menghubungi Anda dan tidak akan dibagikan kepada pihak lain."
          required
        />

        {/* Email */}
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="example@email.com"
          required
          status={fieldStatus.email || 'neutral'}
          statusMessage={fieldErrors.email}
        />

        {/* Password */}
        <PasswordInput
          label="Kata Sandi"
          value={password}
          onChange={handlePasswordChange}
          placeholder="Isi kata sandi Anda"
          required
          status={fieldStatus.password || 'neutral'}
          statusMessage={fieldErrors.password}
          helperText="Minimal 8 karakter."
        />

        {/* Confirm Password */}
        <PasswordInput
          label="Konfirmasi Kata Sandi"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          placeholder="Ulangi kata sandi Anda"
          required
          status={fieldStatus.confirmPassword || 'neutral'}
          statusMessage={fieldErrors.confirmPassword}
        />

        {/* Submit Button */}
        <Button type="submit" hierarchy="primary" className="w-full">
          Buat Akun
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-sm text-gray-500">Atau</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* Google Button */}
        <Button
          type="button"
          hierarchy="secondary"
          className="w-full flex items-center justify-center gap-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Buat Akun dengan Google
        </Button>

        {/* Footer */}
        <p className="text-xs text-content-secondary text-center">
          Dengan mendaftar, Anda menyetujui{' '}
          <a href="#" className="text-[#0968F6] hover:text-[#0049B8] hover:underline">
            Ketentuan
          </a>{' '}
          dan{' '}
          <a href="#" className="text-[#0968F6] hover:text-[#0049B8] hover:underline">
            Kebijakan Privasi
          </a>{' '}
          kami.
        </p>
      </form>
    </div>
  );
}

export default function FormSubmission() {
  return (
    <ConfirmationProvider>
      <ToastProvider>
        <FormContent />
      </ToastProvider>
    </ConfirmationProvider>
  );
}
