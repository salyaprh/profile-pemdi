import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

/** Standar yang diacu IDDS: WCAG 2.2 level AA. */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

interface AuditOptions {
  /** Pemilih elemen yang dikecualikan (hanya untuk masalah di komponen pihak ketiga yang terdokumentasi). */
  exclude?: string[];
  /** ID aturan axe yang dinonaktifkan (wajib disertai alasan di pemanggil). */
  disableRules?: string[];
  tags?: string[];
}

/**
 * Menunggu animasi dan transisi CSS yang berhingga selesai (fade-in toast/modal, tombol yang baru
 * aktif). Selama transisi axe membaca warna campuran yang bukan warna sebenarnya.
 */
async function waitForAnimations(page: Page) {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
}

/** Menjalankan axe dan mengembalikan ringkasan pelanggaran yang mudah dibaca. */
export async function audit(page: Page, options: AuditOptions = {}): Promise<string[]> {
  await waitForAnimations(page);
  let builder = new AxeBuilder({ page }).withTags(options.tags ?? WCAG_TAGS);
  for (const selector of options.exclude ?? []) builder = builder.exclude(selector);
  if (options.disableRules?.length) builder = builder.disableRules(options.disableRules);

  const { violations } = await builder.analyze();
  return violations.map((violation) => {
    const targets = violation.nodes
      .slice(0, 3)
      .map((node) => node.target.join(' '))
      .join(' | ');
    return `${violation.id} [${violation.impact ?? '?'}] ${violation.help} (${violation.nodes.length} elemen) -> ${targets}`;
  });
}
