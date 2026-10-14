import type { MouseEvent, ReactNode } from 'react';
import Footer from './Footer';
import Header from './Header';

const MAIN_ID = 'konten-utama';

export default function Layout({ children }: { children: ReactNode }) {
  const skipToContent = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    document.getElementById(MAIN_ID)?.focus();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background-primary text-content-primary">
      <a
        href={`#${MAIN_ID}`}
        onClick={skipToContent}
        className="sr-only rounded-lg bg-background-primary px-4 py-2 text-caption font-semibold text-primary-600 shadow-lg focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100]"
      >
        Lompat ke konten utama
      </a>
      <Header />
      <main id={MAIN_ID} tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <Footer />
    </div>
  );
}
