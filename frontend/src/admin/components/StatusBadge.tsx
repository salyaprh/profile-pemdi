import { Badge } from '@idds/react';
import type { ArticleStatus } from '../articles/types';

const variants = {
  draf: 'neutral',
  ditinjau: 'warning',
  terbit: 'success',
} as const;

interface StatusBadgeProps {
  status: ArticleStatus;
  label: string;
  trashed?: boolean;
}

export default function StatusBadge({ status, label, trashed = false }: StatusBadgeProps) {
  if (trashed) {
    return (
      <Badge variant="error" size="sm">
        Di sampah
      </Badge>
    );
  }
  return (
    <Badge variant={variants[status]} size="sm">
      {label}
    </Badge>
  );
}
