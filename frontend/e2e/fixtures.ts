import { expect, test as base } from '@playwright/test';

export interface Problems {
  consoleErrors: string[];
  pageErrors: string[];
  cspViolations: string[];
  /** Permintaan ke origin selain situs sendiri (font/CDN/pelacak pihak ketiga). */
  externalRequests: string[];
  /** Pola error konsol yang memang diharapkan pada uji tertentu (mis. respons 500 yang disengaja). */
  allowConsoleErrors: RegExp[];
}

declare global {
  interface Window {
    __reportCsp?: (violation: string) => void;
  }
}

/**
 * Fixture otomatis: SETIAP uji gagal bila halaman menghasilkan error konsol, error JS,
 * pelanggaran CSP, atau permintaan ke origin lain. Dengan begitu CSP ketat dan klaim
 * "tanpa pihak ketiga" diuji terus-menerus, bukan sekali.
 */
export const test = base.extend<{ problems: Problems }>({
  problems: [
    async ({ page, baseURL }, use) => {
      const problems: Problems = {
        consoleErrors: [],
        pageErrors: [],
        cspViolations: [],
        externalRequests: [],
        allowConsoleErrors: [],
      };

      // exposeFunction bertahan antar navigasi penuh, berbeda dengan variabel window biasa.
      await page.exposeFunction('__reportCsp', (violation: string) => {
        problems.cspViolations.push(violation);
      });
      await page.addInitScript(() => {
        document.addEventListener('securitypolicyviolation', (event) => {
          void window.__reportCsp?.(`${event.violatedDirective} -> ${event.blockedURI}`);
        });
      });

      page.on('console', (message) => {
        if (message.type() === 'error') problems.consoleErrors.push(message.text());
      });
      page.on('pageerror', (error) => problems.pageErrors.push(error.message));

      const origin = new URL(baseURL ?? 'http://localhost').origin;
      page.on('request', (request) => {
        const url = new URL(request.url());
        if (['data:', 'blob:', 'about:'].includes(url.protocol)) return;
        if (url.origin !== origin) problems.externalRequests.push(request.url());
      });

      await use(problems);

      const unexpectedConsole = problems.consoleErrors.filter(
        (text) => !problems.allowConsoleErrors.some((pattern) => pattern.test(text)),
      );
      expect(unexpectedConsole, 'error konsol tak terduga').toEqual([]);
      expect(problems.pageErrors, 'error JavaScript tak tertangkap').toEqual([]);
      expect(problems.cspViolations, 'pelanggaran CSP').toEqual([]);
      expect(problems.externalRequests, 'permintaan ke origin lain').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
