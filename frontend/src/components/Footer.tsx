import { Accordion, AccordionGroup, Skeleton } from '@idds/react';
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandX,
  IconBrandYoutube,
  type Icon,
} from '@tabler/icons-react';
import { footerNavigation, siteDescription, siteName } from '../data/siteContent';
import { Link, paths, portfolioUrl } from '../lib/router';
import { useCategories, useSite, type SiteSettings } from '../services/content';

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

const socialLinks: { key: keyof SiteSettings['social']; label: string; icon: Icon }[] = [
  { key: 'facebook', label: 'Facebook', icon: IconBrandFacebook },
  { key: 'instagram', label: 'Instagram', icon: IconBrandInstagram },
  { key: 'x', label: 'X', icon: IconBrandX },
  { key: 'youtube', label: 'YouTube', icon: IconBrandYoutube },
];

/** Deskripsi, kontak, dan media sosial dari pengaturan situs; bagian yang kosong tidak tampil. */
function SiteInfo() {
  const site = useSite();

  if (site.isPending) {
    return (
      <div className="space-y-2" aria-hidden="true">
        <Skeleton width="100%" height="1rem" rounded="md" />
        <Skeleton width="80%" height="1rem" rounded="md" />
      </div>
    );
  }

  // Bila pengaturan gagal dimuat, deskripsi bawaan tetap tampil; kontak dan media sosial menyusul.
  const { description, contact, social } = site.data ?? {
    description: siteDescription,
    contact: { email: null, phone: null, address: null },
    social: { facebook: null, instagram: null, x: null, youtube: null },
  };
  const contactLines = [
    contact.address && <span key="alamat">{contact.address}</span>,
    contact.phone && (
      <a key="telepon" href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`} className={linkClass}>
        {contact.phone}
      </a>
    ),
    contact.email && (
      <a key="email" href={`mailto:${contact.email}`} className={linkClass}>
        {contact.email}
      </a>
    ),
  ].filter(Boolean);
  const socials = socialLinks.filter(({ key }) => social[key]);

  return (
    <>
      <p className="text-caption text-content-secondary">{description}</p>
      {contactLines.length > 0 && (
        <address className="flex flex-col gap-1 text-caption not-italic text-content-secondary">
          {contactLines}
        </address>
      )}
      {socials.length > 0 && (
        <ul className="flex gap-3">
          {socials.map(({ key, label, icon: SocialIcon }) => (
            <li key={key}>
              <a
                href={social[key] ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${label} ${siteName} (membuka tab baru)`}
                className="inline-flex size-9 items-center justify-center rounded-full border border-stroke-primary text-content-secondary transition-colors hover:border-primary-600 hover:text-primary-600"
              >
                <SocialIcon size={18} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/**
 * Pola Footer IDDS: logo + deskripsi, kolom menu, garis pemisah, hak cipta.
 * Desktop memakai kolom, mobile memakai accordion. Tanpa CTA utama.
 */
export default function Footer() {
  const categories = useCategories();
  // Selama kategori dimuat (atau bila gagal), kolomnya cukup berisi tautan ke semua portofolio.
  const categoryLinks = categories.data?.map((category) => ({
    label: category.name,
    to: portfolioUrl(category.slug),
  })) ?? [{ label: 'Semua portofolio', to: paths.portfolio }];

  const footerColumns = [
    { title: 'Navigasi', links: footerNavigation },
    { title: 'Kategori portofolio', links: categoryLinks },
  ];

  return (
    <footer className="border-t border-stroke-primary bg-background-primary">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-8 px-5 py-10 lg:px-8">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div className="max-w-sm space-y-4">
            <Link
              to={paths.home}
              className="inline-block rounded"
              aria-label={`${siteName}, ke beranda`}
            >
              <img src="/panrb.svg" alt="" className="h-10 w-auto" />
            </Link>
            <SiteInfo />
          </div>

          <div className="hidden gap-16 md:flex">
            {footerColumns.map((column) => (
              <nav key={column.title} className="flex flex-col gap-4" aria-label={column.title}>
                <h2 className="text-caption-sm font-semibold text-content-primary">
                  {column.title}
                </h2>
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
