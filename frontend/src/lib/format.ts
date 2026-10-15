/** Memformat tanggal ISO (YYYY-MM-DD) ke gaya Indonesia, mis. "24 Januari 2025". */
export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Memformat waktu ISO 8601 ke WIB, mis. "13 Okt 2026, 14.05 WIB". */
export function formatDateTime(isoDateTime: string): string {
  const formatted = new Date(isoDateTime).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  });
  return `${formatted} WIB`;
}
