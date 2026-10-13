<?php

namespace Tests\Feature\Auth;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/** Ganti kata sandi akun sendiri (PUT /api/auth/password). */
class ChangePasswordTest extends TestCase
{
    use RefreshDatabase;

    private const CURRENT = 'KataSandiLama2026';

    private const NEW = 'KataSandiBaru2026';

    private function user(bool $temporary = false): User
    {
        return User::factory()
            ->when($temporary, fn ($factory) => $factory->temporaryPassword())
            ->create(['email' => 'siti@pemdi.test', 'password' => self::CURRENT]);
    }

    /** @return array<string, string> */
    private function payload(string $new = self::NEW): array
    {
        return ['current_password' => self::CURRENT, 'password' => $new, 'password_confirmation' => $new];
    }

    public function test_requires_a_session(): void
    {
        $this->putJson('/api/auth/password', $this->payload())->assertUnauthorized();
    }

    public function test_changes_the_password_clears_the_temporary_flag_and_logs_without_secrets(): void
    {
        $user = $this->user(temporary: true);

        $this->actingAs($user)->putJson('/api/auth/password', $this->payload())
            ->assertOk()
            ->assertJsonPath('user.must_change_password', false);

        $user->refresh();
        $this->assertTrue(Hash::check(self::NEW, $user->password));
        $this->assertFalse($user->must_change_password);
        $this->assertDatabaseHas('activity_logs', ['action' => 'kata_sandi_diganti', 'user_id' => $user->id]);
        $this->assertStringNotContainsString(self::NEW, (string) json_encode(ActivityLog::all()->toArray()));
        // Panel terbuka kembali.
        $this->getJson('/api/admin/dashboard')->assertOk();
    }

    public function test_a_wrong_current_password_is_rejected_and_nothing_changes(): void
    {
        $user = $this->user();

        $this->actingAs($user)->putJson('/api/auth/password', [...$this->payload(), 'current_password' => 'SalahSalah12345'])
            ->assertUnprocessable()
            ->assertJsonPath('errors.current_password.0', 'Kata sandi saat ini salah.');

        $this->assertTrue(Hash::check(self::CURRENT, $user->refresh()->password));
    }

    public function test_the_new_password_must_be_strong_confirmed_and_different(): void
    {
        $user = $this->actingAs($this->user());

        $user->putJson('/api/auth/password', $this->payload('lemah'))
            ->assertUnprocessable()->assertJsonPath('errors.password.0', 'Kata sandi minimal 12 karakter');
        $user->putJson('/api/auth/password', [...$this->payload(), 'password_confirmation' => 'KataSandiLain2026'])
            ->assertUnprocessable()->assertJsonPath('errors.password.0', 'Konfirmasi tidak sama dengan kata sandi baru');
        $user->putJson('/api/auth/password', $this->payload(self::CURRENT))
            ->assertUnprocessable()->assertJsonPath('errors.password.0', 'Kata sandi baru harus berbeda dari yang sekarang');
        $user->putJson('/api/auth/password', $this->payload('tanpaangkaHURUFsaja'))
            ->assertUnprocessable()->assertJsonPath('errors.password.0', 'Kata sandi harus memuat angka');
    }

    public function test_attempts_are_rate_limited(): void
    {
        $user = $this->actingAs($this->user());

        for ($i = 0; $i < 6; $i++) {
            $user->putJson('/api/auth/password', [...$this->payload(), 'current_password' => 'SalahSalah12345'])->assertUnprocessable();
        }

        $user->putJson('/api/auth/password', $this->payload())->assertStatus(429);
    }

    public function test_other_sessions_end_but_the_current_one_stays(): void
    {
        $user = $this->user();
        $this->postJson('/api/auth/login', ['email' => 'siti@pemdi.test', 'password' => self::CURRENT])->assertOk();
        $this->getJson('/api/admin/dashboard')->assertOk();
        $otherDevice = $this->app['session.store']->all();
        $this->assertArrayHasKey('password_hash_web', $otherDevice);

        // Perangkat ini mengganti kata sandi dan tetap masuk.
        $this->putJson('/api/auth/password', $this->payload())->assertOk();
        $this->getJson('/api/admin/dashboard')->assertOk();

        // Sesi di perangkat lain masih membawa hash kata sandi lama: ditolak.
        $this->app['auth']->forgetGuards();
        $this->flushSession();
        $this->withSession($otherDevice)->actingAs($user->fresh() ?? $user)->getJson('/api/admin/dashboard')->assertUnauthorized();
    }
}
