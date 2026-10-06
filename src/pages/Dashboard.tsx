import { IconArrowUpRight, IconChevronRight } from '@tabler/icons-react';
import { articles } from '../data/articlesData';

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const featuredArticles = articles.slice(0, 3);

  return (
    <div className="overflow-hidden">
      <section className="relative bg-[#0B2148] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_24%,rgba(77,147,252,0.55),transparent_34%),linear-gradient(120deg,#19133A_0%,#0B2148_58%,#0049B8_100%)]" />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 py-20 sm:py-24 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-28">
          <div className="max-w-[650px]">
            <p className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-[#84B4FB]">Pemerintah Digital · PANRB</p>
            <h1 className="max-w-[680px] text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl">Transformasi digital pemerintah untuk Indonesia yang lebih maju.</h1>
            <p className="mt-6 max-w-[560px] text-base leading-7 text-[#D4E5FE] sm:text-lg">PEMDI merangkum karya dan inisiatif TDP dalam membangun layanan pemerintah yang terintegrasi, berdampak, dan berpusat pada kebutuhan masyarakat.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <button type="button" onClick={() => onNavigate?.('articles')} className="inline-flex items-center gap-2 rounded-lg bg-[#0968F6] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#4D93FC]">Lihat portofolio <IconArrowUpRight size={17} /></button>
              <button type="button" onClick={() => onNavigate?.('form')} className="rounded-lg border border-[#84B4FB] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">Hubungi TDP</button>
            </div>
          </div>
          <div className="hidden justify-end lg:flex">
            <div className="relative h-[310px] w-[310px] rounded-[32px] border border-[#84B4FB]/40 bg-white/10 p-7 shadow-2xl backdrop-blur-sm">
              <div className="flex h-full flex-col justify-between rounded-[22px] border border-[#84B4FB]/50 bg-[#EDF8FF] p-6 text-[#002A69]">
                <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[0.15em]">PEMDI</span><span className="h-3 w-3 rounded-full bg-[#0968F6]" /></div>
                <div><div className="mb-3 h-3 w-24 rounded bg-[#84B4FB]" /><div className="h-8 w-44 rounded bg-[#0968F6]" /><div className="mt-5 h-2 w-full rounded bg-[#D4E5FE]" /><div className="mt-2 h-2 w-4/5 rounded bg-[#D4E5FE]" /></div>
                <div className="flex gap-2"><div className="h-10 flex-1 rounded-lg bg-white" /><div className="h-10 w-10 rounded-lg bg-[#0968F6]" /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-5 border-b border-[#D4E5FE] pb-16 sm:grid-cols-3">
          {[['12+', 'Inisiatif transformasi'], ['28', 'Layanan terdigitalisasi'], ['100%', 'Berorientasi dampak']].map(([value, label]) => (
            <div key={label} className="border-l-2 border-[#0968F6] pl-5"><p className="text-3xl font-bold text-[#002A69]">{value}</p><p className="mt-2 text-sm text-[#002A69]/70">{label}</p></div>
          ))}
        </div>

        <div className="mt-16 flex items-end justify-between gap-5">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0968F6]">Karya TDP</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-[#002A69]">Portofolio Pemerintah Digital</h2></div>
          <button type="button" onClick={() => onNavigate?.('articles')} className="hidden items-center gap-1 text-sm font-bold text-[#0968F6] sm:flex">Lihat semua <IconChevronRight size={17} /></button>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {featuredArticles.map((article) => (
            <article key={article.id} className="overflow-hidden rounded-xl border border-[#D4E5FE] bg-white transition hover:-translate-y-1 hover:shadow-lg">
              <img src={article.mediaSrc} alt="" className="h-44 w-full object-cover" />
              <div className="p-5"><p className="text-xs font-semibold text-[#0968F6]">{article.category}</p><h3 className="mt-3 line-clamp-2 text-lg font-bold leading-snug text-[#002A69]">{article.title}</h3><p className="mt-3 line-clamp-2 text-sm leading-6 text-[#002A69]/70">{article.excerpt}</p></div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
