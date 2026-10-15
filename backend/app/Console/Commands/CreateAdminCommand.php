<?php

namespace App\Console\Commands;

use App\Enums\ActivityAction;
use App\Enums\Role;
use App\Http\Requests\PasswordMessages;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

use function Laravel\Prompts\password;
use function Laravel\Prompts\text;

/**
 * Membuat akun Admin pertama. CMS tidak punya pendaftaran publik; akun berikutnya dibuat Admin
 * dari panel. Kata sandi selalu ditanyakan secara tersembunyi (tidak lewat argumen) agar tidak
 * tersimpan di riwayat shell.
 */
class CreateAdminCommand extends Command
{
    protected $signature = 'pemdi:buat-admin';

    protected $description = 'Membuat akun Admin CMS (dipakai saat pemasangan pertama)';

    public function handle(): int
    {
        $name = text(label: 'Nama lengkap', required: true);
        $email = Str::lower(trim(text(label: 'Email', required: true)));
        $password = password(label: 'Kata sandi (min. 12 karakter, huruf besar, huruf kecil, angka)', required: true);
        $confirmation = password(label: 'Ulangi kata sandi', required: true);

        $validator = Validator::make(
            ['name' => $name, 'email' => $email, 'password' => $password, 'password_confirmation' => $confirmation],
            [
                'name' => ['required', 'string', 'min:3', 'max:255'],
                'email' => ['required', 'email', 'max:255', Rule::unique(User::class, 'email')],
                'password' => ['required', 'confirmed', Password::defaults()],
            ],
            [
                'name.min' => 'Nama minimal 3 karakter.',
                'email.email' => 'Format email tidak valid.',
                'email.unique' => 'Email ini sudah terdaftar.',
                'password.confirmed' => 'Kata sandi dan ulangannya tidak sama.',
                ...PasswordMessages::all(),
            ],
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $message) {
                $this->error($message);
            }

            return self::FAILURE;
        }

        $user = new User(['name' => $name, 'email' => $email, 'password' => $password]);
        $user->role = Role::Admin;
        $user->is_active = true;
        $user->save();

        ActivityLog::record(ActivityAction::PenggunaDibuat, "Admin {$user->email} dibuat lewat konsol.", $user);
        $this->info("Admin {$user->email} berhasil dibuat.");

        return self::SUCCESS;
    }
}
