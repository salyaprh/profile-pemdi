import { Alert, Button } from '@idds/react';

interface LoadErrorProps {
  title: string;
  message: string;
  onRetry: () => void;
}

/** Galat saat memuat data: pesan yang dibacakan pembaca layar dan tombol untuk mencoba lagi. */
export default function LoadError({ title, message, onRetry }: LoadErrorProps) {
  return (
    <div className="space-y-3">
      <Alert variant="critical" title={title} message={message} />
      <Button hierarchy="secondary" onClick={onRetry}>
        Coba lagi
      </Button>
    </div>
  );
}
