import ButtonLink from '../components/ButtonLink';
import { paths, usePageTitle } from '../lib/router';

interface NotFoundProps {
  title?: string;
  description?: string;
}

/** Pola 404 Section IDDS (vertikal): kode, judul jelas, penjelasan sopan, dan CTA. */
export default function NotFound({
  title = '404: Halaman tidak ditemukan',
  description = 'Maaf, halaman yang Anda cari tidak tersedia. Halaman tersebut mungkin telah dipindahkan atau tidak lagi dapat diakses.',
}: NotFoundProps) {
  usePageTitle('Halaman tidak ditemukan');

  return (
    <section className="mx-auto flex max-w-[1240px] flex-col items-center gap-6 px-5 py-20 text-center lg:py-28">
      <p className="text-display-lg font-bold text-primary-600" aria-hidden="true">
        404
      </p>
      <div className="flex max-w-md flex-col items-center gap-2 lg:gap-4">
        <h1 className="text-h5 font-semibold text-content-primary">{title}</h1>
        <p className="text-body-sm text-content-secondary">{description}</p>
      </div>
      <ButtonLink to={paths.home} hierarchy="secondary" size="lg">
        Kembali ke beranda
      </ButtonLink>
    </section>
  );
}
