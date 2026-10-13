<?php

namespace App\Support;

use App\Models\Setting;

/**
 * Pengaturan situs yang dikelola Admin dan dibaca situs publik (GET /api/site). Disimpan sebagai
 * satu baris `site` di tabel settings. Nilai bawaan ada di sini, jadi tabel kosong tetap
 * menghasilkan situs yang utuh. Bentuknya sama dengan SiteSettings di
 * frontend/src/services/content.ts.
 *
 * @phpstan-type Stat array{value: string, label: string}
 * @phpstan-type Settings array{
 *     description: string,
 *     hero_stats: list<Stat>,
 *     contact: array{email: ?string, phone: ?string, address: ?string},
 *     social: array{facebook: ?string, instagram: ?string, x: ?string, youtube: ?string}
 * }
 */
final class SiteSettings
{
    private const KEY = 'site';

    /**
     * Angka dan deskripsi di bawah masih placeholder dari desain awal; ganti dengan data resmi
     * lewat halaman Pengaturan.
     *
     * @return Settings
     */
    public static function defaults(): array
    {
        return [
            'description' => 'PEMDI merangkum karya dan inisiatif TDP dalam membangun layanan pemerintah yang terintegrasi, berdampak, dan berpusat pada kebutuhan masyarakat.',
            'hero_stats' => [
                ['value' => '12+', 'label' => 'Inisiatif transformasi'],
                ['value' => '28', 'label' => 'Layanan terdigitalisasi'],
                ['value' => '100%', 'label' => 'Berorientasi dampak'],
            ],
            'contact' => ['email' => null, 'phone' => null, 'address' => null],
            'social' => ['facebook' => null, 'instagram' => null, 'x' => null, 'youtube' => null],
        ];
    }

    /**
     * Nilai tersimpan di atas nilai bawaan. Kunci yang tidak dikenal diabaikan, dan nilai yang
     * bentuknya rusak (mis. hasil edit manual di database) jatuh ke nilai bawaan.
     *
     * @return Settings
     */
    public static function get(): array
    {
        $defaults = self::defaults();
        $stored = Setting::query()->find(self::KEY)?->value;
        if (! is_array($stored)) {
            return $defaults;
        }

        $stats = $stored['hero_stats'] ?? null;
        $validStats = is_array($stats) && count($stats) === count($defaults['hero_stats']);

        return [
            'description' => is_string($stored['description'] ?? null) ? $stored['description'] : $defaults['description'],
            'hero_stats' => $validStats ? self::stats($stats) : $defaults['hero_stats'],
            'contact' => self::strings($stored['contact'] ?? null, $defaults['contact']),
            'social' => self::strings($stored['social'] ?? null, $defaults['social']),
        ];
    }

    /**
     * @param  Settings  $settings  Sudah divalidasi (App\Http\Requests\SiteSettingsRequest).
     * @return Settings
     */
    public static function save(array $settings): array
    {
        Setting::query()->updateOrCreate(['key' => self::KEY], ['value' => $settings]);

        return self::get();
    }

    /**
     * @param  array<mixed>  $stats
     * @return list<Stat>
     */
    private static function stats(array $stats): array
    {
        return array_values(array_map(
            fn (mixed $stat): array => [
                'value' => is_array($stat) && is_string($stat['value'] ?? null) ? $stat['value'] : '',
                'label' => is_array($stat) && is_string($stat['label'] ?? null) ? $stat['label'] : '',
            ],
            $stats,
        ));
    }

    /**
     * @template TKeys of array<string, ?string>
     *
     * @param  TKeys  $defaults
     * @return TKeys
     */
    private static function strings(mixed $stored, array $defaults): array
    {
        $stored = is_array($stored) ? $stored : [];
        $result = [];
        foreach ($defaults as $key => $default) {
            $result[$key] = is_string($stored[$key] ?? null) && $stored[$key] !== '' ? $stored[$key] : $default;
        }

        /** @var TKeys $result */
        return $result;
    }
}
