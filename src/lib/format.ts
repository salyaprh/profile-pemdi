/** Memformat tanggal ISO (YYYY-MM-DD) ke gaya Indonesia, mis. "24 Januari 2025". */
export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
