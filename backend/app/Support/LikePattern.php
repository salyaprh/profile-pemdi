<?php

namespace App\Support;

use Illuminate\Contracts\Database\Query\Builder;

/**
 * Pencarian "mengandung kata" yang sama perilakunya di SQLite, MySQL/MariaDB, dan PostgreSQL:
 * tidak peka huruf besar/kecil, dan `%` / `_` yang diketik pengguna dicari apa adanya (bukan
 * wildcard). Karakter escape `!` dipakai karena backslash tidak berlaku sama di semua database.
 */
final class LikePattern
{
    /**
     * @template TBuilder of Builder
     *
     * @param  TBuilder  $query
     * @param  list<string>  $columns  Nama kolom tetap dari kode (bukan masukan pengguna).
     * @return TBuilder
     */
    public static function whereAnyContains(Builder $query, array $columns, string $term): Builder
    {
        $pattern = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower($term)).'%';

        return $query->where(function (Builder $where) use ($columns, $pattern): void {
            foreach ($columns as $column) {
                $where->orWhereRaw("lower({$column}) like ? escape '!'", [$pattern]);
            }
        });
    }
}
