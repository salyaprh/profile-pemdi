import { useEffect } from 'react';
import { IconExternalLink } from '@tabler/icons-react';
import ButtonLink from '../components/ButtonLink';
import { services } from '../data/siteContent';
import { paths, scrollToHash } from '../lib/router';
import { usePageMeta } from '../lib/seo';

const description =
  'Layanan Pemerintah Digital: evaluasi kinerja, kompetensi digital ASN, Arsitektur SPBE, dan evaluasi anggaran.';

/**
 * Daftar layanan PEMDI (menu Layanan di header). Tiap kartu berjangkar (/layanan#evaluasi) dan
 * menaut ke platform layanannya di tab baru. Kartu memakai kelas CSS Card IDDS (ina-card).
 */
export default function Services() {
  usePageMeta({ title: 'Layanan', description, path: paths.services });

  // Tautan langsung ber-#jangkar (mis. dibagikan): gulir ke kartunya setelah halaman tampil.
  useEffect(() => {
    if (window.location.hash) scrollToHash();
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1240px] px-5 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mb-8 space-y-2">
        <h1 className="text-h5 font-bold text-content-primary lg:text-h3">Layanan</h1>
        <p className="text-body-sm text-content-secondary">
          Platform layanan Pemerintah Digital yang dapat diakses instansi pemerintah dan ASN.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-6">
        {services.map(({ id, name, title, description: text, url, icon: ServiceIcon }) => (
          <li key={id}>
            {/* scroll-mt: kartu tidak tertutup header sticky saat dituju lewat #jangkar. */}
            <section
              id={id}
              tabIndex={-1}
              aria-labelledby={`judul-${id}`}
              className="ina-card ina-card--variant-basic h-full w-full scroll-mt-24"
            >
              <div className="ina-card__content flex h-full flex-col gap-4">
                <span className="inline-flex size-12 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                  <ServiceIcon size={24} aria-hidden="true" />
                </span>
                <div className="flex-1 space-y-2">
                  <h2
                    id={`judul-${id}`}
                    className="text-body-lg font-semibold text-content-primary"
                  >
                    {title}
                  </h2>
                  <p className="text-caption text-content-secondary">{text}</p>
                </div>
                <ButtonLink
                  to={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Buka ${name} (membuka tab baru)`}
                  className="self-start"
                >
                  Buka {name}
                  <IconExternalLink size={18} aria-hidden="true" />
                </ButtonLink>
              </div>
            </section>
          </li>
        ))}
      </ul>
    </div>
  );
}
