<?php

namespace Tests\Feature\Admin;

use App\Enums\ActivityAction;
use App\Enums\ActivityGroup;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Halaman Aktivitas: log yang hanya bisa dibaca Admin. */
class ActivityLogTest extends TestCase
{
    use RefreshDatabase;

    private function log(ActivityAction $action, string $description, ?User $user = null, ?string $createdAt = null): ActivityLog
    {
        $entry = ActivityLog::record($action, $description, user: $user);
        if ($createdAt !== null) {
            $entry->forceFill(['created_at' => $createdAt])->save();
        }

        return $entry;
    }

    public function test_only_admins_can_read_the_log(): void
    {
        $this->getJson('/api/admin/activity')->assertUnauthorized();
        $this->actingAs(User::factory()->create())->getJson('/api/admin/activity')->assertForbidden();
    }

    public function test_lists_newest_first_with_actor_and_ip(): void
    {
        $siti = User::factory()->create(['name' => 'Siti Penulis']);
        $this->log(ActivityAction::ArtikelDibuat, 'Membuat artikel "A".', $siti, '2026-10-13 03:00:00');
        $this->log(ActivityAction::LoginGagal, 'Percobaan masuk gagal untuk x@pemdi.test.', null, '2026-10-13 03:05:00');

        $response = $this->actingAs(User::factory()->admin()->create())->getJson('/api/admin/activity')->assertOk();

        $this->assertSame(['login_gagal', 'artikel_dibuat'], array_column($response->json('data'), 'action'));
        $this->assertSame([
            'id' => $response->json('data.1.id'),
            'action' => 'artikel_dibuat',
            'description' => 'Membuat artikel "A".',
            'user_name' => 'Siti Penulis',
            'ip_address' => '127.0.0.1',
            'created_at' => '2026-10-13T03:00:00+00:00',
        ], $response->json('data.1'));
        $this->assertNull($response->json('data.0.user_name'));
        $this->assertStringContainsString('no-store', (string) $response->headers->get('Cache-Control'));
        $response->assertJsonPath('meta.per_page', 30);
    }

    public function test_filters_by_group(): void
    {
        foreach (ActivityAction::cases() as $action) {
            $this->log($action, $action->value);
        }
        $this->actingAs(User::factory()->admin()->create());

        foreach (ActivityGroup::cases() as $group) {
            $expected = $group->actionValues();
            $found = [];
            for ($page = 1; $page <= 3; $page++) {
                $found = [...$found, ...array_column($this->getJson("/api/admin/activity?kelompok={$group->value}&page={$page}")->json('data'), 'action')];
            }
            $this->assertEqualsCanonicalizing($expected, $found, "kelompok {$group->value}");
        }
        $this->assertContains('login_gagal', ActivityGroup::Login->actionValues());
        $this->assertContains('kata_sandi_diganti', ActivityGroup::Pengguna->actionValues());
        // Kelompok yang tidak dikenal = semua (halaman pertama memuat 30 catatan).
        $this->assertCount(min(30, count(ActivityAction::cases())), $this->getJson('/api/admin/activity?kelompok=ngawur')->json('data'));
    }

    public function test_every_action_belongs_to_exactly_one_group(): void
    {
        $grouped = collect(ActivityGroup::cases())->flatMap(fn (ActivityGroup $group) => $group->actionValues());

        $this->assertEqualsCanonicalizing(array_column(ActivityAction::cases(), 'value'), $grouped->all());
        $this->assertSame($grouped->count(), $grouped->unique()->count());
    }

    public function test_entries_older_than_the_retention_period_are_pruned(): void
    {
        $old = $this->log(ActivityAction::Login, 'lama', null, now()->subMonths(24)->subDay()->toDateTimeString());
        $recent = $this->log(ActivityAction::Login, 'baru', null, now()->subMonths(23)->toDateTimeString());

        $this->artisan('model:prune', ['--model' => [ActivityLog::class]])->assertSuccessful();

        $this->assertModelMissing($old);
        $this->assertModelExists($recent);
    }
}
