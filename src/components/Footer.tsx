import { Accordion, AccordionGroup } from '@idds/react';
import { footerColumns, siteDescription, siteName } from '../data/siteContent';
import { Link, paths } from '../lib/router';

const linkClass =
  'text-caption font-medium text-content-secondary transition-colors hover:text-primary-600';

function ColumnLinks({ links }: { links: { label: string; to: string }[] }) {
  return (
    <ul className="flex w-fit flex-col gap-2">
      {links.map((link) => (
        <li key={link.to}>
          <Link to={link.to} className={linkClass}>
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Pola Footer IDDS: logo + deskripsi, kolom menu, garis pemisah, hak cipta.
 * Desktop memakai kolom, mobile memakai accordion. Tanpa CTA utama.
 */
export default function Footer() {
  return (
    <footer className="border-t border-stroke-primary bg-background-primary">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-8 px-5 py-10 lg:px-8">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div className="max-w-sm space-y-4">
            <Link to={paths.home} className="inline-block rounded" aria-label={`${siteName}, ke beranda`}>
              <img src="/panrb.svg" alt="" className="h-10 w-auto" />
            </Link>
            <p className="text-caption text-content-secondary">{siteDescription}</p>
          </div>

          <div className="hidden gap-16 md:flex">
            {footerColumns.map((column) => (
              <nav key={column.title} className="flex flex-col gap-4" aria-label={column.title}>
                <h2 className="text-caption-sm font-semibold text-content-primary">{column.title}</h2>
                <ColumnLinks links={column.links} />
              </nav>
            ))}
          </div>

          <div className="md:hidden">
            <AccordionGroup multipleOpen>
              {footerColumns.map((column) => (
                <Accordion key={column.title} title={column.title}>
                  <nav aria-label={column.title} className="pb-2">
                    <ColumnLinks links={column.links} />
                  </nav>
                </Accordion>
              ))}
            </AccordionGroup>
          </div>
        </div>

        <hr className="border-stroke-primary" />

        <p className="text-caption-sm text-content-secondary">
          &copy; {new Date().getFullYear()} {siteName}. Hak cipta dilindungi.
        </p>
      </div>
    </footer>
  );
}
