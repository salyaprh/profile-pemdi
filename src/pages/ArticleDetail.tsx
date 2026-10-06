import { useMemo } from 'react';
import { articles } from '../data/articlesData';

interface ArticleDetailProps {
  articleId: string;
  onBack: () => void;
}

export default function ArticleDetail({
  articleId,
  onBack,
}: ArticleDetailProps) {
  const article = useMemo(() => {
    return articles.find((a) => a.id === articleId);
  }, [articleId]);

  if (!article) {
    return (
      <div className="w-full flex justify-center">
        <div className="w-full max-w-[720px] md:p-6">
          <div className="text-center py-12">
            <h1 className="text-2xl md:text-3xl font-semibold text-content-primary mb-4">
              Artikel Tidak Ditemukan
            </h1>
            <p className="text-content-secondary mb-6">
              Artikel dengan ID "{articleId}" tidak ditemukan.
            </p>
            <button
              onClick={onBack}
              className="text-[#0968F6] hover:text-[#0049B8] underline"
            >
              Kembali ke Daftar Artikel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Format date
  const formattedDate = new Date(article.date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-[720px] md:p-6">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="inline-flex items-center text-xs sm:text-sm text-content-secondary hover:text-content-primary mb-6"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Kembali
        </button>

        {/* Article Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-content-primary mb-4">
            {article.title}
          </h1>
          <p className="text-base md:text-lg text-content-secondary mb-4">
            {article.excerpt}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center space-x-2 space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 text-xs md:text-sm text-content-secondary">
              <span>{article.author}</span>
              <span>•</span>
              <span>{formattedDate}</span>
              <span className="hidden sm:inline">•</span>
            </div>
            <div className="px-2 sm:px-3 py-1 bg-[#D4E5FE] text-[#0049B8] rounded-full text-xs font-medium w-fit">
              {article.category}
            </div>
          </div>
        </div>

        {/* Article Image */}
        {article.mediaSrc && (
          <div className="mb-8">
            <img
              src={article.mediaSrc}
              alt={article.title}
              className="w-full h-auto rounded-lg"
            />
            <p className="text-[10px] sm:text-xs text-content-secondary mt-2">
              Sumber: inadigitalnews.com
            </p>
          </div>
        )}

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          <p className="text-sm sm:text-base lg:text-lg text-content-primary leading-relaxed mb-4">
            <b>Jakarta</b> — Pemerintah terus mendorong percepatan transformasi
            digital di lingkungan Aparatur Sipil Negara (ASN) melalui penguatan
            integrasi layanan dalam platform INAgov.
          </p>
          <p className="text-sm sm:text-base lg:text-lg text-content-primary leading-relaxed mb-4">
            Kementerian Pendayagunaan Aparatur Negara dan Reformasi Birokrasi
            (KemenPANRB) menyatakan bahwa integrasi berbagai layanan ASN ke
            dalam satu portal bertujuan untuk mengurangi fragmentasi sistem yang
            selama ini menghambat efisiensi kerja.
          </p>
          <p className="text-sm sm:text-base lg:text-lg text-content-primary leading-relaxed mb-4">
            "Selama ini ASN harus berpindah-pindah platform untuk mengakses
            layanan yang berbeda. Dengan INAgov, kami ingin menghadirkan
            pengalaman yang lebih sederhana, konsisten, dan efisien," ujar
            perwakilan KemenPANRB dalam keterangan resminya.
          </p>
          <p className="text-sm sm:text-base lg:text-lg text-content-primary leading-relaxed mb-4">
            Integrasi ini mencakup layanan informasi kepegawaian, pengembangan
            kompetensi, akses kebijakan terbaru, dan berbagai layanan
            administratif lainnya. Melalui platform terpadu ini, diharapkan ASN
            dapat menghemat waktu dan meningkatkan produktivitas kerja.
          </p>
          <p className="text-sm sm:text-base lg:text-lg text-content-primary leading-relaxed mb-4">
            Selain efisiensi, penguatan INAgov juga diharapkan dapat
            meningkatkan transparansi dan akuntabilitas dalam penyelenggaraan
            pemerintahan. Semua informasi dan layanan yang tersedia di platform
            ini dapat diakses dengan mudah oleh seluruh ASN di seluruh
            Indonesia.
          </p>
          <p className="text-sm sm:text-base lg:text-lg text-content-primary leading-relaxed">
            Ke depan, pemerintah berencana untuk terus mengembangkan fitur
            INAgov dengan menambahkan lebih banyak layanan dan meningkatkan
            kualitas konten informasi yang tersedia. Langkah ini merupakan
            bagian dari komitmen pemerintah dalam mempercepat transformasi
            digital sektor publik.
          </p>
        </div>
      </div>
    </div>
  );
}
