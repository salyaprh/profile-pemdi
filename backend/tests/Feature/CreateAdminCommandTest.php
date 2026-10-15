<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Testing\PendingCommand;
use Tests\TestCase;

class CreateAdminCommandTest extends TestCase
{
    use RefreshDatabase;

    private function runCommand(string $name, string $email, string $password, ?string $confirmation = null): PendingCommand
    {
        return $this->artisan('pemdi:buat-admin')
            ->expectsQuestion('Nama lengkap', $name)
            ->expectsQuestion('Email', $email)
            ->expectsQuestion('Kata sandi (min. 12 karakter, huruf besar, huruf kecil, angka)', $password)
            ->expectsQuestion('Ulangi kata sandi', $confirmation ?? $password);
    }

    public function test_creates_an_active_admin_with_a_hashed_password(): void
    {
        $this->runCommand('Admin Utama', ' Admin@PANRB.go.id ', 'RahasiaKuat2026')
            ->expectsOutput('Admin admin@panrb.go.id berhasil dibuat.')
            ->assertSuccessful();

        $user = User::sole();
        $this->assertSame('admin@panrb.go.id', $user->email);
        $this->assertSame(Role::Admin, $user->role);
        $this->assertTrue($user->is_active);
        $this->assertTrue(Hash::check('RahasiaKuat2026', $user->password));
        $this->assertDatabaseHas('activity_logs', ['action' => 'pengguna_dibuat', 'subject_id' => $user->id]);
    }

    public function test_rejects_a_weak_password(): void
    {
        $this->runCommand('Admin Utama', 'admin@panrb.go.id', 'pendek')
            ->expectsOutput('Kata sandi minimal 12 karakter')
            ->assertFailed();

        $this->assertSame(0, User::count());
    }

    public function test_rejects_a_password_without_mixed_case_and_numbers(): void
    {
        $this->runCommand('Admin Utama', 'admin@panrb.go.id', 'katasandipanjangsekali')
            ->expectsOutput('Kata sandi harus memuat huruf besar dan huruf kecil')
            ->expectsOutput('Kata sandi harus memuat angka')
            ->assertFailed();
    }

    public function test_rejects_a_mismatched_confirmation(): void
    {
        $this->runCommand('Admin Utama', 'admin@panrb.go.id', 'RahasiaKuat2026', 'RahasiaKuat2027')
            ->expectsOutput('Kata sandi dan ulangannya tidak sama.')
            ->assertFailed();
    }

    public function test_rejects_an_email_that_is_already_registered(): void
    {
        User::factory()->create(['email' => 'admin@panrb.go.id']);

        $this->runCommand('Admin Utama', 'ADMIN@panrb.go.id', 'RahasiaKuat2026')
            ->expectsOutput('Email ini sudah terdaftar.')
            ->assertFailed();

        $this->assertSame(1, User::count());
    }
}
