<?php

namespace App\Enums;

/** Kelompok aksi di log aktivitas, untuk filter di halaman Aktivitas (lihat ActivityAction::group()). */
enum ActivityGroup: string
{
    case Login = 'login';
    case Artikel = 'artikel';
    case Kategori = 'kategori';
    case Pesan = 'pesan';
    case Pengguna = 'pengguna';
    case Pengaturan = 'pengaturan';

    /**
     * Kode semua aksi yang termasuk kelompok ini.
     *
     * @return list<string>
     */
    public function actionValues(): array
    {
        return array_values(array_map(
            fn (ActivityAction $action): string => $action->value,
            array_filter(ActivityAction::cases(), fn (ActivityAction $action): bool => $action->group() === $this),
        ));
    }
}
