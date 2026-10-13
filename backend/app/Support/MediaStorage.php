<?php

namespace App\Support;

use App\Models\Media;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\WebpEncoder;
use Intervention\Image\ImageManager;

/**
 * Menyimpan gambar unggahan. Berkas asli TIDAK pernah disimpan: gambar di-decode lalu di-encode
 * ulang ke WebP, sehingga metadata (EXIF, lokasi GPS) terbuang dan berkas "polyglot" (mis. gambar
 * yang menyisipkan kode PHP/HTML) tidak bertahan. Nama berkas acak (UUID).
 */
final class MediaStorage
{
    /** Lebar maksimum gambar isi/sampul; gambar lebih kecil tidak diperbesar. */
    public const MAX_WIDTH = 1600;

    /** Ukuran pratinjau tautan (og:image) yang disarankan WhatsApp/Facebook. */
    public const OG_WIDTH = 1200;

    public const OG_HEIGHT = 630;

    private const QUALITY = 82;

    public function store(UploadedFile $file, ?User $uploader): Media
    {
        $manager = new ImageManager(Driver::class);
        $directory = (string) config('pemdi.media_directory');
        $name = (string) Str::uuid();
        $path = "{$directory}/{$name}.webp";
        $ogPath = "{$directory}/{$name}-og.webp";

        // orient(): putar sesuai EXIF sebelum metadata dibuang, agar foto ponsel tidak miring.
        $image = $manager->decodePath($file->getRealPath())->orient();
        $og = clone $image;

        $image->scaleDown(width: self::MAX_WIDTH);
        $og->cover(self::OG_WIDTH, self::OG_HEIGHT);

        $disk = Storage::disk('public');
        $encoder = new WebpEncoder(quality: self::QUALITY, strip: true);
        $disk->put($path, $image->encode($encoder)->toString());
        $disk->put($ogPath, $og->encode($encoder)->toString());

        return Media::create([
            'path' => $path,
            'og_path' => $ogPath,
            'original_name' => mb_substr($file->getClientOriginalName(), 0, 255),
            'size' => (int) $disk->size($path),
            'width' => $image->width(),
            'height' => $image->height(),
            'uploaded_by' => $uploader?->id,
        ]);
    }
}
