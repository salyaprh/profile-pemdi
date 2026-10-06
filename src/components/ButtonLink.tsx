import type { ComponentProps } from 'react';
import { Link } from '../lib/router';

type Hierarchy = 'primary' | 'secondary' | 'tertiary' | 'light' | 'outline-light';
type Size = 'md' | 'lg' | 'xl';

/**
 * Tautan bergaya tombol IDDS. Komponen <Button> IDDS merender <button>,
 * sehingga navigasi memakai <a> asli (lewat Link) dengan gaya yang sama.
 * 'light' dan 'outline-light' dipakai di atas latar gelap (hero).
 */
const hierarchyClass: Record<Hierarchy, string> = {
  primary: 'bg-primary-primary text-white hover:bg-primary-primary/90',
  secondary:
    'border border-stroke-primary bg-background-primary text-content-primary hover:bg-background-secondary',
  tertiary: 'text-content-primary hover:bg-background-tertiary',
  light: 'bg-white text-primary-700 hover:bg-primary-50',
  'outline-light': 'border border-white/60 text-white hover:bg-white/10',
};

const sizeClass: Record<Size, string> = {
  md: 'h-10 px-3 text-caption',
  lg: 'h-11 px-4 text-caption',
  xl: 'h-12 px-5 text-body-sm',
};

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  hierarchy?: Hierarchy;
  size?: Size;
}

export default function ButtonLink({
  hierarchy = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonLinkProps) {
  return (
    // Isi tautan datang lewat {...props} (children), yang tidak terlihat oleh linter.
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    <Link
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors ${hierarchyClass[hierarchy]} ${sizeClass[size]} ${className}`}
      {...props}
    />
  );
}
