<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/** Parameter filter berbentuk array atau tak wajar tidak boleh menjadi galat 500. */
class ListFiltersTest extends TestCase
{
    use RefreshDatabase;

    /** @return iterable<string, array{string}> */
    public static function arrayQueries(): iterable
    {
        yield 'publik: cari' => ['/api/articles?cari[]=x'];
        yield 'publik: kategori' => ['/api/articles?kategori[]=a'];
        yield 'admin artikel: status' => ['/api/admin/articles?status[]=draf'];
        yield 'admin artikel: kategori' => ['/api/admin/articles?kategori[]=1'];
        yield 'admin artikel: kategori bukan angka' => ['/api/admin/articles?kategori=abc'];
        yield 'admin artikel: cari' => ['/api/admin/articles?cari[a]=x'];
        yield 'admin pesan: status' => ['/api/admin/messages?status[]=belum-dibaca'];
        yield 'admin pengguna: status' => ['/api/admin/users?status[]=aktif'];
        yield 'admin pengguna: cari' => ['/api/admin/users?cari[]=x'];
        yield 'admin aktivitas: kelompok' => ['/api/admin/activity?kelompok[]=login'];
    }

    #[DataProvider('arrayQueries')]
    public function test_malformed_filters_are_rejected_with_422(string $url): void
    {
        $this->actingAs(User::factory()->admin()->create())->getJson($url)->assertUnprocessable();
    }

    public function test_odd_but_scalar_values_are_tolerated(): void
    {
        $this->actingAs(User::factory()->admin()->create());

        foreach (['page=-5', 'page=abc', 'page=99999999999999999999', 'per_page[]=1', 'cari=%00', 'cari='.str_repeat('é', 5000)] as $query) {
            $this->getJson("/api/articles?{$query}")->assertOk();
        }
        $this->getJson('/api/admin/users?status=ngawur')->assertOk();
        $this->getJson('/api/admin/activity?kelompok=ngawur')->assertOk();
    }
}
