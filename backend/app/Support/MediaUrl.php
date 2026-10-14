<?php

namespace App\Support;

/**
 * Aturan URL gambar yang boleh dipakai artikel: hanya gambar unggahan CMS sendiri (/storage/...)
 * atau gambar bawaan situs (/images/articles/...). URL luar ditolak agar konten tidak memuat
 * sumber pihak ketiga (CSP img-src 'self') dan tidak bisa dipakai untuk melacak pembaca.
 */
final class MediaUrl
{
    /** Nama berkas unggahan (UUID); sama dengan pola di isUploaded(). */
    private const UUID = '[a-f0-9-]{36}';

    /**
     * Semua UUID gambar unggahan yang disebut dalam teks (URL sampul atau HTML isi artikel). Satu UUID
     * mencakup versi biasa dan versi -og.
     *
     * @return list<string>
     */
    public static function uuidsIn(string $text): array
    {
        preg_match_all('#/storage/[a-z0-9_-]+/('.self::UUID.')(?:-og)?\.webp#', $text, $matches);

        return array_values(array_unique($matches[1]));
    }

    public static function isUploaded(string $url): bool
    {
        $directory = preg_quote((string) config('pemdi.media_directory'), '#');

        return preg_match('#^/storage/'.$directory.'/'.self::UUID.'(-og)?\.webp$#', $url) === 1;
    }

    public static function isAllowedCover(string $url): bool
    {
        return self::isUploaded($url) || preg_match('#^/images/articles/[a-z0-9-]+\.webp$#', $url) === 1;
    }
}
