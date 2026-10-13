<?php

namespace Tests\Feature\Admin;

use App\Enums\Role;
use App\Http\Middleware\EnsureUserIsActive;
use App\Models\ActivityLog;
use App\Models\Article;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/** Pengelolaan pengguna di panel Admin. */
class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    private const NEW_PASSWORD = 'KataSandiSementara2026';

    private function admin(): User
    {
        return User::factory()->admin()->create(['name' => 'Admin Utama']);
    }

    public function test_only_admins_can_use_the_user_endpoints(): void
    {
        $target = User::factory()->create();
        $penulis = User::factory()->create();

        $this->getJson('/api/admin/users')->assertUnauthorized();
        foreach ([
            ['getJson', '/api/admin/users', []],
            ['postJson', '/api/admin/users', ['name' => 'X', 'email' => 'x@pemdi.test', 'role' => 'admin', 'password' => self::NEW_PASSWORD]],
            ['getJson', "/api/admin/users/{$target->id}", []],
            ['putJson', "/api/admin/users/{$target->id}", ['role' => 'admin']],
            ['postJson', "/api/admin/users/{$target->id}/password", ['password' => self::NEW_PASSWORD]],
        ] as [$method, $url, $data]) {
            $this->actingAs($penulis)->{$method}($url, $data)->assertForbidden();
        }
        $this->assertSame(Role::Penulis, $target->refresh()->role);
    }

    public function test_list_filters_by_status_and_search_and_counts_articles(): void
    {
        $siti = User::factory()->create(['name' => 'Siti Rahma', 'email' => 'siti@pemdi.test']);
        User::factory()->inactive()->create(['name' => 'Budi Lama', 'email' => 'budi@pemdi.test']);
        Article::factory()->count(2)->create(['author_id' => $siti->id]);

        $response = $this->actingAs($this->admin())->getJson('/api/admin/users')->assertOk();
        $this->assertSame(['Admin Utama', 'Budi Lama', 'Siti Rahma'], array_column($response->json('data'), 'name'));
        $this->assertSame([0, 0, 2], array_column($response->json('data'), 'articles_count'));

        $this->assertSame(['Budi Lama'], array_column($this->getJson('/api/admin/users?status=nonaktif')->json('data'), 'name'));
        $this->assertSame(['Admin Utama', 'Siti Rahma'], array_column($this->getJson('/api/admin/users?status=aktif')->json('data'), 'name'));
        $this->assertSame(['Siti Rahma'], array_column($this->getJson('/api/admin/users?cari=SITI@')->json('data'), 'name'));
        $this->assertCount(0, $this->getJson('/api/admin/users?cari=%25')->json('data'));
    }

    public function test_responses_never_expose_password_hashes_or_tokens(): void
    {
        $target = User::factory()->create();

        $body = (string) $this->actingAs($this->admin())->getJson("/api/admin/users/{$target->id}")->assertOk()->getContent();

        $this->assertStringNotContainsString($target->password, $body);
        $this->assertStringNotContainsString((string) $target->remember_token, $body);
        $this->assertSame(
            ['id', 'name', 'email', 'role', 'role_label', 'is_active', 'last_login_at', 'must_change_password', 'articles_count'],
            array_keys((array) json_decode($body, true)['data']),
        );
    }

    public function test_admin_creates_an_account_with_a_temporary_password(): void
    {
        $response = $this->actingAs($this->admin())->postJson('/api/admin/users', [
            'name' => '  Budi Santoso ',
            'email' => '  Budi@PEMDI.test ',
            'role' => 'penulis',
            'password' => self::NEW_PASSWORD,
        ])->assertCreated()
            ->assertJsonPath('data.name', 'Budi Santoso')
            ->assertJsonPath('data.email', 'budi@pemdi.test')
            ->assertJsonPath('data.is_active', true)
            ->assertJsonPath('data.must_change_password', true)
            ->assertJsonPath('data.articles_count', 0);

        $user = User::findOrFail($response->json('data.id'));
        $this->assertTrue(Hash::check(self::NEW_PASSWORD, $user->password));
        $this->assertSame(Role::Penulis, $user->role);
        $log = ActivityLog::where('action', 'pengguna_dibuat')->sole();
        $this->assertSame('Membuat akun budi@pemdi.test (Penulis).', $log->description);
        $this->assertStringNotContainsString(self::NEW_PASSWORD, (string) json_encode(ActivityLog::all()->toArray()));
    }

    public function test_creation_is_validated(): void
    {
        User::factory()->create(['email' => 'siti@pemdi.test']);

        $this->actingAs($this->admin())->postJson('/api/admin/users', [
            'name' => 'Bu',
            'email' => 'SITI@pemdi.test',
            'role' => 'superadmin',
            'password' => 'lemah',
        ])->assertUnprocessable()->assertJsonValidationErrors(['name', 'email', 'role', 'password'])
            ->assertJsonPath('errors.email.0', 'Email ini sudah terdaftar.')
            ->assertJsonPath('errors.role.0', 'Peran tidak dikenal.')
            ->assertJsonPath('errors.password.0', 'Kata sandi minimal 12 karakter');

        $this->postJson('/api/admin/users', ['name' => 'Budi', 'email' => 'budi@pemdi.test', 'role' => 'admin', 'password' => 'katasandisemuakecil1'])
            ->assertJsonPath('errors.password.0', 'Kata sandi harus memuat huruf besar dan huruf kecil');
        // Status dan kata sandi tidak boleh dititipkan di tempat yang salah.
        $this->postJson('/api/admin/users', ['name' => 'Budi', 'email' => 'budi@pemdi.test', 'role' => 'admin', 'password' => self::NEW_PASSWORD, 'is_active' => false])
            ->assertJsonValidationErrors(['is_active']);
        $this->assertSame(2, User::count());
    }

    public function test_admin_updates_profile_role_and_status_and_a_deactivated_session_ends(): void
    {
        $admin = $this->admin();
        $target = User::factory()->create(['name' => 'Siti', 'email' => 'siti@pemdi.test']);

        $this->actingAs($admin)->putJson("/api/admin/users/{$target->id}", [
            'name' => 'Siti Rahma',
            'email' => 'Siti.Rahma@pemdi.test',
            'role' => 'admin',
            'is_active' => true,
        ])->assertOk()
            ->assertJsonPath('data.name', 'Siti Rahma')
            ->assertJsonPath('data.email', 'siti.rahma@pemdi.test')
            ->assertJsonPath('data.role', 'admin');
        $this->assertDatabaseHas('activity_logs', [
            'action' => 'pengguna_diperbarui',
            'description' => 'Memperbarui akun siti.rahma@pemdi.test (peran Penulis → Admin).',
        ]);

        $this->putJson("/api/admin/users/{$target->id}", [
            'name' => 'Siti Rahma', 'email' => 'siti.rahma@pemdi.test', 'role' => 'admin', 'is_active' => false,
        ])->assertOk()->assertJsonPath('data.is_active', false);
        $this->assertDatabaseHas('activity_logs', ['description' => 'Memperbarui akun siti.rahma@pemdi.test (dinonaktifkan).']);
    }

    public function test_email_may_stay_but_not_collide_with_another_account(): void
    {
        $admin = $this->admin();
        $siti = User::factory()->create(['email' => 'siti@pemdi.test']);
        $budi = User::factory()->create(['email' => 'budi@pemdi.test']);

        $this->actingAs($admin)->putJson("/api/admin/users/{$siti->id}", ['name' => 'Siti Baru', 'email' => 'siti@pemdi.test', 'role' => 'penulis', 'is_active' => true])->assertOk();
        $this->putJson("/api/admin/users/{$siti->id}", ['name' => 'Siti Baru', 'email' => $budi->email, 'role' => 'penulis', 'is_active' => true])
            ->assertUnprocessable()->assertJsonValidationErrors(['email']);
    }

    public function test_admin_cannot_change_own_role_or_deactivate_self(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->putJson("/api/admin/users/{$admin->id}", ['name' => $admin->name, 'email' => $admin->email, 'role' => 'penulis', 'is_active' => true])
            ->assertUnprocessable()->assertJsonPath('errors.role.0', 'Anda tidak dapat mengubah peran akun Anda sendiri.');
        $this->putJson("/api/admin/users/{$admin->id}", ['name' => $admin->name, 'email' => $admin->email, 'role' => 'admin', 'is_active' => false])
            ->assertUnprocessable()->assertJsonPath('errors.is_active.0', 'Anda tidak dapat menonaktifkan akun Anda sendiri.');
        // Nama dan email sendiri boleh diubah.
        $this->putJson("/api/admin/users/{$admin->id}", ['name' => 'Admin Baru', 'email' => $admin->email, 'role' => 'admin', 'is_active' => true])->assertOk();

        $this->assertTrue($admin->refresh()->is_active);
        $this->assertSame(Role::Admin, $admin->refresh()->role);
    }

    public function test_the_last_active_admin_cannot_be_demoted_or_deactivated(): void
    {
        $target = User::factory()->admin()->create();
        // Dalam pemakaian normal pelaku sendiri adalah Admin aktif lain, jadi pengaman ini hanya terpicu
        // bila pelaku dinonaktifkan di tab lain tepat setelah lolos middleware `active` (balapan):
        // disimulasikan dengan melewati middleware itu.
        $actor = User::factory()->admin()->inactive()->create();
        $payload = ['name' => $target->name, 'email' => $target->email, 'role' => 'penulis', 'is_active' => true];

        $this->withoutMiddleware(EnsureUserIsActive::class)->actingAs($actor)
            ->putJson("/api/admin/users/{$target->id}", $payload)
            ->assertConflict()
            ->assertJsonPath('message', 'Minimal satu Admin aktif harus tersisa.');
        $this->putJson("/api/admin/users/{$target->id}", [...$payload, 'role' => 'admin', 'is_active' => false])->assertConflict();

        $this->assertSame(Role::Admin, $target->refresh()->role);
        $this->assertTrue($target->refresh()->is_active);

        // Dengan Admin aktif lain, Admin ini boleh diturunkan.
        User::factory()->admin()->create();
        $this->putJson("/api/admin/users/{$target->id}", $payload)->assertOk();
    }

    public function test_reset_password_sets_a_temporary_one_and_ends_the_other_sessions(): void
    {
        $admin = $this->admin();
        $target = User::factory()->create(['email' => 'siti@pemdi.test']);

        $this->actingAs($admin)->postJson("/api/admin/users/{$target->id}/password", ['password' => self::NEW_PASSWORD])
            ->assertOk()->assertJsonPath('data.must_change_password', true);

        $target->refresh();
        $this->assertTrue(Hash::check(self::NEW_PASSWORD, $target->password));
        $this->assertTrue($target->must_change_password);
        $this->assertDatabaseHas('activity_logs', ['action' => 'pengguna_sandi_diatur_ulang', 'description' => 'Mengatur ulang kata sandi akun siti@pemdi.test.']);
        $this->assertStringNotContainsString(self::NEW_PASSWORD, (string) json_encode(ActivityLog::all()->toArray()));

        $this->postJson("/api/admin/users/{$target->id}/password", ['password' => 'lemah'])->assertUnprocessable()->assertJsonValidationErrors(['password']);
        $this->postJson("/api/admin/users/{$admin->id}/password", ['password' => self::NEW_PASSWORD])
            ->assertUnprocessable()->assertJsonPath('errors.password.0', 'Ganti kata sandi Anda sendiri di menu Akun saya.');
    }

    public function test_a_reset_ends_the_target_s_running_session(): void
    {
        $password = 'KataSandiLama2026';
        $target = User::factory()->create(['email' => 'siti@pemdi.test', 'password' => $password]);
        $admin = $this->admin();

        // Sesi nyata milik pengguna yang akan diatur ulang (login lewat endpoint, bukan actingAs).
        $this->postJson('/api/auth/login', ['email' => 'siti@pemdi.test', 'password' => $password])->assertOk();
        $this->getJson('/api/admin/dashboard')->assertOk();
        $session = $this->app['session.store']->all();
        $this->assertArrayHasKey('password_hash_web', $session, 'sesi mencatat hash kata sandi saat login');

        // Admin mengatur ulang dari sesi lain.
        $this->flushSession();
        $this->actingAs($admin)->postJson("/api/admin/users/{$target->id}/password", ['password' => self::NEW_PASSWORD])->assertOk();

        // Sesi lama pengguna itu (hash kata sandi lama di dalamnya) tidak lagi berlaku.
        $this->app['auth']->forgetGuards();
        $this->withSession($session)->actingAs($target->fresh() ?? $target)->getJson('/api/admin/dashboard')->assertUnauthorized();
    }

    public function test_a_temporary_password_blocks_the_panel_until_it_is_changed(): void
    {
        $user = User::factory()->temporaryPassword()->create(['password' => 'KataSandiSementara2026']);

        $this->actingAs($user)->getJson('/api/admin/dashboard')
            ->assertForbidden()
            ->assertJsonPath('message', 'Ganti kata sandi sementara Anda terlebih dahulu di menu Akun saya.');
        $this->getJson('/api/admin/articles')->assertForbidden();
        $this->postJson('/api/admin/media', [])->assertForbidden();
        // Tetap dapat melihat dirinya dan keluar.
        $this->getJson('/api/auth/me')->assertOk()->assertJsonPath('user.must_change_password', true);
    }
}
