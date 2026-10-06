import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Menangkap error saat render agar pengunjung tidak melihat layar putih.
 * Fallback sengaja tidak bergantung pada router/provider apa pun
 * (memakai <a href> dan reload penuh) supaya tetap tampil bila itu yang rusak.
 */
export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Titik kait untuk pelaporan error (mis. Sentry) bila nanti dipasang.
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background-primary px-5 py-16 text-center text-content-primary"
      >
        <img src="/panrb.svg" alt="PANRB" className="h-10 w-auto" />
        <div className="flex max-w-md flex-col gap-2">
          <h1 className="text-h5 font-semibold">Halaman ini sedang bermasalah</h1>
          <p className="text-body-sm text-content-secondary">
            Maaf, terjadi gangguan saat menampilkan halaman. Silakan muat ulang
            halaman atau kembali ke beranda.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-11 items-center rounded-lg bg-primary-primary px-4 text-caption font-medium text-white transition-colors hover:bg-primary-primary/90"
          >
            Muat ulang halaman
          </button>
          <a
            href="/"
            className="inline-flex h-11 items-center rounded-lg border border-stroke-primary px-4 text-caption font-medium transition-colors hover:bg-background-secondary"
          >
            Kembali ke beranda
          </a>
        </div>
      </div>
    );
  }
}
