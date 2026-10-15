import { setupServer } from 'msw/node';

/**
 * Server API tiruan (MSW) untuk uji: setiap uji memasang handler sendiri dengan server.use().
 * Permintaan tanpa handler membuat uji gagal, jadi tidak ada panggilan jaringan yang lolos diam-diam.
 */
export const server = setupServer();

/** Mengatur cookie XSRF-TOKEN seperti yang dipasang backend Laravel. */
export function setXsrfCookie(token: string) {
  document.cookie = `XSRF-TOKEN=${encodeURIComponent(token)}; path=/`;
}

export function clearCookies() {
  for (const cookie of document.cookie.split('; ')) {
    const name = cookie.split('=')[0];
    if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
}
