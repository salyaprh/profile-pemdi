<?php

namespace App\Support;

/**
 * Aturan URL gambar yang boleh dipakai artikel: hanya gambar unggahan CMS sendiri (/storage/...)
 * atau gambar bawaan situs (/images/articles/...). URL luar ditolak agar konten tidak memuat
 * sumber pihak ketiga (CSP img-src 'self') dan tidak bisa dipakai untuk melacak pembaca.
 */
final class MediaUrl
{
    public static function isUploaded(string $url): bool
    {
        $directory = preg_quote((string) config('pemdi.media_directory'), '#');

        return preg_match('#^/storage/'.$directory.'/[a-f0-9-]{36}(-og)?\.webp$#', $url) === 1;
    }

    public static function isAllowedCover(string $url): bool
    {
        return self::isUploaded($url) || preg_match('#^/images/articles/[a-z0-9-]+\.webp$#', $url) === 1;
    }
}
