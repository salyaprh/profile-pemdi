<?php

namespace Tests\Feature\Admin;

use App\Enums\ActivityAction;
use App\Models\ActivityLog;
use App\Models\Article;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_get_401_json_not_a_redirect(): void
    {
        $response = $this->getJson('/api/admin/dashboard')->assertUnauthorized()->assertJsonPath('message', 'Unauthenticated.');
        // Juga respons galat: middleware auth berprioritas lebih tinggi daripada middleware biasa.
        $this->assertStringContainsString('no-store', (string) $response->headers->get('Cache-Control'));
        $this->get('/api/admin/dashboard')->assertUnauthorized();
    }

    public function test_deactivated_user_is_logged_out_mid_session(): void
    {
        $user = User::factory()->inactive()->create();

        $this->actingAs($user)->getJson('/api/admin/dashboard')
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Akun Anda dinonaktifkan. Hubungi Admin.');

        $this->assertGuest();
    }

    public function test_admin_sees_counts_for_all_articles_and_recent_activity(): void
    {
        $admin = User::factory()->admin()->create(['name' => 'Admin Utama']);
        Article::factory()->published()->count(3)->create();
        Article::factory()->inReview()->count(2)->create();
        Article::factory()->create();
        Article::factory()->published()->create()->delete(); // di sampah: tidak dihitung
        ActivityLog::record(ActivityAction::Login, 'Masuk ke CMS.', user: $admin);

        $response = $this->actingAs($admin)->getJson('/api/admin/dashboard')->assertOk();

        $response->assertJsonPath('metrics', ['published' => 3, 'in_review' => 2, 'draft' => 1]);
        $response->assertJsonPath('recent_activity.0.action', 'login');
        $response->assertJsonPath('recent_activity.0.user_name', 'Admin Utama');
        $this->assertStringContainsString('no-store', (string) $response->headers->get('Cache-Control'));
    }

    public function test_penulis_only_sees_own_articles_and_no_activity_log(): void
    {
        $penulis = User::factory()->create();
        Article::factory()->for($penulis, 'author')->inReview()->create();
        Article::factory()->for($penulis, 'author')->count(2)->create();
        Article::factory()->published()->count(5)->create(); // milik orang lain
        ActivityLog::record(ActivityAction::Login, 'Masuk ke CMS.', user: $penulis);

        $this->actingAs($penulis)->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertExactJson([
                'metrics' => ['published' => 0, 'in_review' => 1, 'draft' => 2],
                'recent_activity' => [],
            ]);
    }

    public function test_recent_activity_is_limited_and_newest_first(): void
    {
        $admin = User::factory()->admin()->create();
        foreach (range(1, 10) as $i) {
            ActivityLog::record(ActivityAction::ArtikelDiperbarui, "Aksi {$i}", user: $admin);
        }

        $activity = $this->actingAs($admin)->getJson('/api/admin/dashboard')->json('recent_activity');

        $this->assertCount(8, $activity);
        $this->assertSame('Aksi 10', $activity[0]['description']);
    }
}
