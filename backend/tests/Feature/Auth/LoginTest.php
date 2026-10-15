<?php

namespace Tests\Feature\Auth;

use App\Http\Requests\LoginRequest;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    private const PASSWORD = 'KataSandiBenar123';

    /** @param array<string, mixed> $attributes */
    private function user(array $attributes = []): User
    {
        return User::factory()->create(['email' => 'penulis@pemdi.test', 'password' => self::PASSWORD, ...$attributes]);
    }

    public function test_valid_credentials_log_in_and_return_the_user(): void
    {
        $user = $this->user(['name' => 'Siti Penulis']);

        $this->postJson('/api/auth/login', ['email' => 'penulis@pemdi.test', 'password' => self::PASSWORD])
            ->assertOk()
            ->assertExactJson(['user' => [
                'id' => $user->id,
                'name' => 'Siti Penulis',
                'email' => 'penulis@pemdi.test',
                'role' => 'penulis',
                'role_label' => 'Penulis',
            ]]);

        $this->assertAuthenticatedAs($user);
        $this->assertNotNull($user->fresh()->last_login_at);
        $this->assertDatabaseHas('activity_logs', ['action' => 'login', 'user_id' => $user->id, 'ip_address' => '127.0.0.1']);
    }

    public function test_email_is_case_insensitive_and_trimmed(): void
    {
        $user = $this->user();

        $this->postJson('/api/auth/login', ['email' => '  Penulis@PEMDI.test ', 'password' => self::PASSWORD])->assertOk();

        $this->assertAuthenticatedAs($user);
    }

    public function test_login_regenerates_the_session_id(): void
    {
        $this->user();
        $this->startSession();
        $before = session()->getId();

        $this->postJson('/api/auth/login', ['email' => 'penulis@pemdi.test', 'password' => self::PASSWORD])->assertOk();

        $this->assertNotSame($before, session()->getId());
    }

    /** @return array<string, array{string, string}> */
    public static function wrongCredentials(): array
    {
        return [
            'kata sandi salah' => ['penulis@pemdi.test', 'KataSandiSalah123'],
            'email tidak terdaftar' => ['tidak-ada@pemdi.test', self::PASSWORD],
        ];
    }

    #[DataProvider('wrongCredentials')]
    public function test_wrong_credentials_get_the_same_generic_message(string $email, string $password): void
    {
        $this->user();

        $this->postJson('/api/auth/login', ['email' => $email, 'password' => $password])
            ->assertUnprocessable()
            ->assertExactJson([
                'message' => 'Email atau kata sandi salah.',
                'errors' => ['email' => ['Email atau kata sandi salah.']],
            ]);

        $this->assertGuest();
        $this->assertDatabaseHas('activity_logs', ['action' => 'login_gagal', 'description' => "Percobaan masuk gagal untuk {$email}.", 'user_id' => null]);
    }

    public function test_unknown_email_still_verifies_a_password_hash(): void
    {
        // Tanpa ini, email yang tidak terdaftar dijawab jauh lebih cepat dan keberadaan akun bisa ditebak.
        Hash::shouldReceive('check')->once()->andReturnFalse();

        $this->postJson('/api/auth/login', ['email' => 'tidak-ada@pemdi.test', 'password' => 'apa saja'])
            ->assertUnprocessable();
    }

    public function test_inactive_account_cannot_log_in(): void
    {
        $user = $this->user(['is_active' => false]);

        $this->postJson('/api/auth/login', ['email' => 'penulis@pemdi.test', 'password' => self::PASSWORD])
            ->assertUnprocessable()
            ->assertJsonPath('errors.email.0', 'Akun ini dinonaktifkan. Hubungi Admin untuk mengaktifkannya kembali.');

        $this->assertGuest();
        $this->assertDatabaseHas('activity_logs', ['action' => 'login_ditolak', 'user_id' => $user->id]);
    }

    public function test_input_is_validated_with_indonesian_messages(): void
    {
        $this->postJson('/api/auth/login', ['email' => 'bukan-email', 'password' => ''])
            ->assertUnprocessable()
            ->assertJsonPath('errors.email.0', 'Format email tidak valid.')
            ->assertJsonPath('errors.password.0', 'Kata sandi wajib diisi.');

        $this->assertSame(0, ActivityLog::count(), 'input tidak valid bukan percobaan masuk');
    }

    public function test_account_is_locked_after_repeated_failures_even_with_the_right_password(): void
    {
        $this->user();

        for ($i = 0; $i < LoginRequest::MAX_ATTEMPTS_PER_ACCOUNT; $i++) {
            $this->postJson('/api/auth/login', ['email' => 'penulis@pemdi.test', 'password' => 'Salah'.$i])->assertUnprocessable();
        }

        $this->postJson('/api/auth/login', ['email' => 'penulis@pemdi.test', 'password' => self::PASSWORD])
            ->assertTooManyRequests()
            ->assertJsonPath('errors.email.0', fn (string $message) => str_starts_with($message, 'Terlalu banyak percobaan masuk. Coba lagi dalam '));

        $this->assertGuest();
    }

    public function test_successful_login_resets_the_failure_counter(): void
    {
        $this->user();

        for ($i = 0; $i < LoginRequest::MAX_ATTEMPTS_PER_ACCOUNT - 1; $i++) {
            $this->postJson('/api/auth/login', ['email' => 'penulis@pemdi.test', 'password' => 'Salah'.$i]);
        }
        $this->postJson('/api/auth/login', ['email' => 'penulis@pemdi.test', 'password' => self::PASSWORD])->assertOk();
        $this->postJson('/api/auth/logout')->assertNoContent();

        $this->postJson('/api/auth/login', ['email' => 'penulis@pemdi.test', 'password' => 'Salah lagi'])->assertUnprocessable();
        $this->postJson('/api/auth/login', ['email' => 'penulis@pemdi.test', 'password' => self::PASSWORD])->assertOk();
    }

    public function test_one_ip_cannot_guess_across_many_accounts(): void
    {
        for ($i = 0; $i < LoginRequest::MAX_ATTEMPTS_PER_IP; $i++) {
            $this->postJson('/api/auth/login', ['email' => "akun{$i}@pemdi.test", 'password' => 'Salah'])->assertUnprocessable();
        }

        $this->postJson('/api/auth/login', ['email' => 'akun-baru@pemdi.test', 'password' => 'Salah'])->assertTooManyRequests();
    }

    public function test_auth_responses_are_not_cacheable(): void
    {
        $this->user();

        $response = $this->postJson('/api/auth/login', ['email' => 'penulis@pemdi.test', 'password' => self::PASSWORD]);

        $this->assertStringContainsString('no-store', (string) $response->headers->get('Cache-Control'));
        $this->assertStringContainsString('private', (string) $response->headers->get('Cache-Control'));
    }
}
