<?php

namespace Tests\Feature\Admin;

use App\Models\ActivityLog;
use App\Models\Setting;
use App\Models\User;
use App\Support\SiteSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Pengaturan situs: dikelola Admin (/api/admin/settings), dibaca publik (/api/site). */
class SiteSettingsTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_replace_recursive([
            'description' => '  Deskripsi situs resmi PEMDI PANRB untuk pengunjung.  ',
            'hero_stats' => [
                ['value' => ' 30 ', 'label' => 'Layanan terdigitalisasi'],
                ['value' => '14+', 'label' => 'Inisiatif'],
                ['value' => '99%', 'label' => 'Kepuasan'],
            ],
            'contact' => ['email' => 'humas@panrb.go.id', 'phone' => '(021) 555-1234', 'address' => 'Jakarta'],
            'social' => ['facebook' => null, 'instagram' => 'https://www.instagram.com/panrb', 'x' => '', 'youtube' => null],
        ], $overrides);
    }

    public function test_the_public_site_serves_defaults_when_nothing_is_saved(): void
    {
        $this->getJson('/api/site')->assertOk()->assertExactJson(['data' => SiteSettings::defaults()]);
        $this->assertDatabaseCount('settings', 0);
    }

    public function test_only_admins_can_read_or_change_settings(): void
    {
        $this->getJson('/api/admin/settings')->assertUnauthorized();
        $penulis = User::factory()->create();

        $this->actingAs($penulis)->getJson('/api/admin/settings')->assertForbidden();
        $this->putJson('/api/admin/settings', $this->payload())->assertForbidden();
        $this->assertDatabaseCount('settings', 0);
    }

    public function test_admin_saves_trimmed_settings_visible_on_the_public_site(): void
    {
        $this->actingAs(User::factory()->admin()->create())->putJson('/api/admin/settings', $this->payload())
            ->assertOk()
            ->assertJsonPath('data.description', 'Deskripsi situs resmi PEMDI PANRB untuk pengunjung.')
            ->assertJsonPath('data.hero_stats.0', ['value' => '30', 'label' => 'Layanan terdigitalisasi'])
            ->assertJsonPath('data.contact.email', 'humas@panrb.go.id')
            ->assertJsonPath('data.social.x', null);

        $this->getJson('/api/admin/settings')->assertOk()->assertJsonPath('data.hero_stats.1.value', '14+');
        $public = $this->getJson('/api/site')->assertOk();
        $public->assertJsonPath('data.social.instagram', 'https://www.instagram.com/panrb');
        $public->assertJsonPath('data.contact.address', 'Jakarta');
        $this->assertDatabaseHas('activity_logs', ['action' => 'pengaturan_diperbarui']);
        // Menyimpan ulang menimpa satu baris yang sama.
        $this->putJson('/api/admin/settings', $this->payload())->assertOk();
        $this->assertDatabaseCount('settings', 1);
    }

    public function test_unknown_keys_are_dropped(): void
    {
        $this->actingAs(User::factory()->admin()->create())
            ->putJson('/api/admin/settings', $this->payload() + ['jahat' => '<script>', 'social' => [...$this->payload()['social'], 'tiktok' => 'https://tiktok.com/x']])
            ->assertOk();

        $stored = Setting::findOrFail('site')->value;
        $this->assertSame(['description', 'hero_stats', 'contact', 'social'], array_keys($stored));
        $this->assertSame(['facebook', 'instagram', 'x', 'youtube'], array_keys($stored['social']));
    }

    public function test_validation_uses_the_same_messages_as_the_frontend(): void
    {
        $response = $this->actingAs(User::factory()->admin()->create())->putJson('/api/admin/settings', $this->payload([
            'description' => 'pendek',
            'hero_stats' => [['value' => str_repeat('1', 11)], ['label' => ''], ['value' => '']],
            'contact' => ['email' => 'bukan-email', 'phone' => 'abc'],
            'social' => ['facebook' => 'http://facebook.com/x', 'instagram' => 'javascript:alert(1)', 'x' => 'www.x.com'],
        ]))->assertUnprocessable();

        // Kunci galat bertitik (hero_stats.0.value) dibaca langsung dari JSON, bukan lewat path.
        $errors = array_map(fn (array $messages): string => $messages[0], $response->json('errors'));
        $this->assertEqualsCanonicalizing([
            'description' => 'Deskripsi minimal 20 karakter',
            'hero_stats.0.value' => 'Angka maksimal 10 karakter',
            'contact.email' => 'Format email tidak valid',
            'contact.phone' => 'Nomor telepon hanya boleh berisi angka, spasi, +, -, titik, dan kurung',
            'social.facebook' => 'Gunakan alamat lengkap yang diawali https://',
            'social.instagram' => 'Gunakan alamat lengkap yang diawali https://',
            'social.x' => 'Gunakan alamat lengkap yang diawali https://',
        ], array_intersect_key($errors, array_flip([
            'description', 'hero_stats.0.value', 'contact.email', 'contact.phone', 'social.facebook', 'social.instagram', 'social.x',
        ])));
        $this->assertSame('Keterangan wajib diisi', $errors['hero_stats.1.label']);
        $this->assertSame('Angka wajib diisi', $errors['hero_stats.2.value']);
    }

    public function test_exactly_three_stats_are_required(): void
    {
        $admin = User::factory()->admin()->create();
        $stats = $this->payload()['hero_stats'];

        $this->actingAs($admin)->putJson('/api/admin/settings', [...$this->payload(), 'hero_stats' => array_slice($stats, 0, 2)])
            ->assertUnprocessable()->assertJsonPath('errors.hero_stats.0', 'Harus ada tepat 3 angka');
        $this->putJson('/api/admin/settings', [...$this->payload(), 'hero_stats' => [...$stats, ['value' => '1', 'label' => 'x']]])
            ->assertUnprocessable()->assertJsonValidationErrors(['hero_stats']);
    }

    public function test_corrupted_stored_values_fall_back_to_defaults(): void
    {
        Setting::create(['key' => 'site', 'value' => ['description' => 123, 'hero_stats' => 'rusak', 'contact' => 'x', 'social' => ['x' => ['bukan string']]]]);

        $this->getJson('/api/site')->assertOk()->assertExactJson(['data' => SiteSettings::defaults()]);
    }

    public function test_public_site_response_is_cookieless_and_revalidated(): void
    {
        $response = $this->getJson('/api/site')->assertOk();

        $this->assertEmpty($response->headers->getCookies());
        $this->assertStringContainsString('no-cache', (string) $response->headers->get('Cache-Control'));
        $this->assertNotNull($response->headers->get('ETag'));
        $this->assertSame(0, ActivityLog::count());
    }
}
