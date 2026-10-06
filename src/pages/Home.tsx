import { IconArrowRight } from '@tabler/icons-react';
import ArticleCard from '../components/ArticleCard';
import ButtonLink from '../components/ButtonLink';
import { articles } from '../data/articlesData';
import { heroStats } from '../data/siteContent';
import { paths } from '../lib/router';
import { usePageMeta } from '../lib/seo';

export default function Home() {
  usePageMeta({ title: 'Pemerintah Digital', path: paths.home });
  const featuredArticles = articles.slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden bg-primary-900 text-white">
        <div
          className="absolute inset-0 bg-linear-to-br from-primary-900 via-primary-800 to-primary-600"
          aria-hidden="true"
        />
        <div
          className="absolute -right-24 -top-24 size-[28rem] rounded-full bg-primary-400/25 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 py-16 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-28">
          <div className="max-w-[650px]">
            <p className="mb-6 text-caption font-bold tracking-wide text-primary-200">
              Pemerintah Digital · PANRB
            </p>
            <h1 className="text-h3 font-bold sm:text-display-sm lg:text-display-lg">
              Transformasi digital pemerintah untuk Indonesia yang lebih maju.
            </h1>
            <p className="mt-6 max-w-[560px] text-body-sm text-primary-50 sm:text-body">
              PEMDI merangkum karya dan inisiatif TDP dalam membangun layanan pemerintah yang
              terintegrasi, berdampak, dan berpusat pada kebutuhan masyarakat.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink to={paths.portfolio} hierarchy="light" size="xl">
                Lihat portofolio <IconArrowRight size={18} aria-hidden="true" />
              </ButtonLink>
              <ButtonLink to={paths.contact} hierarchy="outline-light" size="xl">
                Hubungi TDP
              </ButtonLink>
            </div>
          </div>

          <div className="hidden justify-end lg:flex" aria-hidden="true">
            <div className="h-[310px] w-[310px] rounded-[32px] border border-white/30 bg-white/10 p-7 shadow-2xl backdrop-blur-sm">
              <div className="flex h-full flex-col justify-between rounded-[22px] bg-background-primary p-6 text-content-primary">
                <div className="flex items-center justify-between">
                  <span className="text-caption-sm font-bold tracking-widest">PEMDI</span>
                  <span className="size-3 rounded-full bg-primary-600" />
                </div>
                <div>
                  <div className="mb-3 h-3 w-24 rounded bg-primary-200" />
                  <div className="h-8 w-44 rounded bg-primary-600" />
                  <div className="mt-5 h-2 w-full rounded bg-background-tertiary" />
                  <div className="mt-2 h-2 w-4/5 rounded bg-background-tertiary" />
                </div>
                <div className="flex gap-2">
                  <div className="h-10 flex-1 rounded-lg bg-background-tertiary" />
                  <div className="size-10 rounded-lg bg-primary-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-12 lg:px-8 lg:py-16">
        <ul className="grid gap-6 sm:grid-cols-3">
          {heroStats.map(({ value, label }) => (
            <li key={label} className="border-l-2 border-primary-600 pl-5">
              <p className="text-h4 font-bold text-content-primary">{value}</p>
              <p className="mt-1 text-caption text-content-secondary">{label}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Pola Blog Section IDDS: judul + deskripsi, kartu seragam, tombol "Lihat Semua". */}
      <section className="bg-background-secondary" aria-labelledby="judul-portofolio">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-5 py-14 lg:gap-8 lg:px-8 lg:py-20">
          <div className="space-y-2">
            <p className="text-caption font-bold text-primary-600">Karya TDP</p>
            <h2 id="judul-portofolio" className="text-h5 font-bold text-content-primary lg:text-h3">
              Portofolio Pemerintah Digital
            </h2>
            <p className="max-w-[640px] text-body-sm text-content-secondary">
              Jelajahi kabar, wawasan, dan dokumentasi inisiatif Pemerintah Digital.
            </p>
          </div>

          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {featuredArticles.map((article) => (
              <li key={article.id}>
                <ArticleCard article={article} />
              </li>
            ))}
          </ul>

          <div>
            <ButtonLink to={paths.portfolio} hierarchy="primary" size="lg">
              Lihat semua
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
