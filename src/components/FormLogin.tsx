import { Button, Checkbox, TextField, useToast } from '@idds/react';
import { IconBrandGoogle } from '@tabler/icons-react';
import { useState } from 'react';

export default function FormLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { toast: showToast } = useToast();
  const handleEmailChange = (val: string) => {
    setEmail(val);
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    showToast({
      title: 'Data berhasil dikirim!',
      state: 'positive',
      position: 'top-right',
      duration: 3000,
    });
  };

  return (
    <div className="bg-neutral-25 p-8 rounded-lg shadow-sm flex flex-col gap-4 w-md mx-auto">
      <div className="flex w-full items-center justify-center mb-4">
        <img src="/panrb.svg" alt="Panrb Logo" width={200} height={200} />
      </div>
      <p className="text-content-primary text-xs md:text-md font-medium text-center">
        Masuk menggunakan akun SSO BKN Anda
      </p>
      <TextField
        label="Email"
        type="email"
        placeholder="nama@example.com"
        size="md"
        value={email}
        onChange={handleEmailChange}
      />
      <TextField
        label="Password"
        type="password"
        placeholder="Masukkan password"
        size="md"
        value={password}
        onChange={handlePasswordChange}
      />
      <Checkbox
        id="terms-checkbox-menyetujui"
        label="Saya menyetujui syarat dan ketentuan"
        checked={termsAccepted}
        onChange={(checked: boolean) => setTermsAccepted(checked)}
      />
      <Button
        hierarchy="primary"
        size="md"
        onClick={handleSubmit}
        disabled={isSubmitting || !termsAccepted || !email || !password}
      >
        Submit
      </Button>
      <div className="flex items-center space-x-2">
        <div className="border-t border-stroke-primary flex-1"></div>
        <span className="text-content-tertiary text-sm">atau</span>
        <div className="border-t border-stroke-primary flex-1"></div>
      </div>
      <Button
        hierarchy="secondary"
        size="md"
        onClick={() => {
          alert('Masuk dengan Google');
        }}
      >
        <div className="flex items-center space-x-2">
          <IconBrandGoogle size={16} />
          <span>Masuk dengan Google</span>
        </div>
      </Button>
    </div>
  );
}
