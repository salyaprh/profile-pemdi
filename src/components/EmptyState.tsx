import type { ReactNode } from 'react';
import { IconSearchOff } from '@tabler/icons-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  /** CTA opsional, mis. tombol untuk mengatur ulang filter. */
  action?: ReactNode;
}

/** Pola Empty State IDDS: ikon, judul, deskripsi, dan CTA opsional. */
export default function EmptyState({
  title,
  description,
  icon = <IconSearchOff size={32} aria-hidden="true" />,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-stroke-primary bg-background-primary px-6 py-12 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-background-tertiary text-content-secondary">
        {icon}
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="text-body font-semibold text-content-primary">{title}</h2>
        <p className="text-caption text-content-secondary">{description}</p>
      </div>
      {action}
    </div>
  );
}
