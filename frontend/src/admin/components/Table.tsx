import type { ReactNode } from 'react';

interface DataTableProps {
  /** Nama tabel untuk pembaca layar (juga nama wilayah gulir). */
  label: string;
  head: ReactNode;
  children: ReactNode;
}

/**
 * Kerangka tabel daftar admin (pola Table IDDS): wilayah yang bisa digulir ke samping di layar
 * sempit (di bawah 720 px) dan dapat difokus keyboard (WCAG 2.1.1; axe: scrollable-region-focusable). Isi
 * `head` berupa <tr> berisi <th scope="col">, `children` berupa baris <tr>.
 */
export function DataTable({ label, head, children }: DataTableProps) {
  return (
    <div
      role="region"
      aria-label={label}
      // Wilayah gulir wajib dapat difokus agar bisa digulir dengan keyboard.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      className="overflow-x-auto rounded-xl border border-stroke-primary bg-background-primary"
    >
      <table className="w-full min-w-[720px] text-left text-caption">
        <thead className="border-b border-stroke-primary bg-background-secondary text-content-secondary">
          {head}
        </thead>
        <tbody className="divide-y divide-stroke-primary">{children}</tbody>
      </table>
    </div>
  );
}

export function HeaderCell({ children }: { children: ReactNode }) {
  return (
    <th scope="col" className="px-4 py-3 font-medium">
      {children}
    </th>
  );
}
