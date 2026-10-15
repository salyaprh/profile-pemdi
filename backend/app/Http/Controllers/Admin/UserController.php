<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ActivityAction;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\ResetPasswordRequest;
use App\Http\Requests\UserRequest;
use App\Http\Resources\ManagedUserResource;
use App\Models\ActivityLog;
use App\Models\User;
use App\Support\LikePattern;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Pengelolaan pengguna CMS (khusus Admin; middleware admin di routes/api.php). Akun tidak
 * dihapus agar riwayat penulis artikel utuh: akses dicabut dengan menonaktifkannya. Kata sandi
 * yang ditetapkan di sini bersifat sementara; pemiliknya wajib menggantinya (must_change_password).
 */
class UserController extends Controller
{
    private const PER_PAGE = 20;

    /** Filter: ?status=aktif|nonaktif, ?cari=<nama atau email>, ?page=<n>. */
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate(['status' => ['nullable', 'string'], 'cari' => ['nullable', 'string']]);
        $status = $filters['status'] ?? '';
        $search = mb_substr(trim($filters['cari'] ?? ''), 0, 100);

        $users = User::query()
            ->withCount('articles')
            ->when($status === 'aktif', fn (Builder $query) => $query->where('is_active', true))
            ->when($status === 'nonaktif', fn (Builder $query) => $query->where('is_active', false))
            ->when($search !== '', fn (Builder $query) => LikePattern::whereAnyContains($query, ['name', 'email'], $search))
            ->orderBy('name')
            ->orderBy('id')
            ->paginate(self::PER_PAGE)
            ->withQueryString();

        return ManagedUserResource::collection($users);
    }

    public function show(User $user): ManagedUserResource
    {
        return new ManagedUserResource($user->loadCount('articles'));
    }

    public function store(UserRequest $request): JsonResponse
    {
        $user = new User([...$request->profileData(), 'password' => $request->string('password')->value()]);
        $user->is_active = true;
        $user->must_change_password = true;
        $user->save();

        ActivityLog::record(ActivityAction::PenggunaDibuat, "Membuat akun {$user->email} ({$user->role->label()}).", $user);

        return (new ManagedUserResource($user->loadCount('articles')))->response()->setStatusCode(201);
    }

    public function update(UserRequest $request, User $user): ManagedUserResource
    {
        $data = $request->profileData();
        $active = $request->boolean('is_active');

        if ($user->is(auth()->user())) {
            // Mengubah peran atau status akun sendiri bisa mengunci Admin dari panel.
            throw_if($data['role'] !== $user->role, ValidationException::withMessages([
                'role' => 'Anda tidak dapat mengubah peran akun Anda sendiri.',
            ]));
            throw_if(! $active, ValidationException::withMessages([
                'is_active' => 'Anda tidak dapat menonaktifkan akun Anda sendiri.',
            ]));
        }

        DB::transaction(function () use ($user, $data, $active): void {
            $this->ensureAnotherActiveAdminRemains($user, $data['role'], $active);

            $changes = [];
            if ($data['role'] !== $user->role) {
                $changes[] = "peran {$user->role->label()} → {$data['role']->label()}";
            }
            if ($active !== $user->is_active) {
                $changes[] = $active ? 'diaktifkan' : 'dinonaktifkan';
            }

            $user->fill(['name' => $data['name'], 'email' => $data['email']]);
            $user->role = $data['role'];
            $user->is_active = $active;
            $user->save();

            $detail = $changes === [] ? '' : ' ('.implode(', ', $changes).')';
            ActivityLog::record(ActivityAction::PenggunaDiperbarui, "Memperbarui akun {$user->email}{$detail}.", $user);
        });

        return new ManagedUserResource($user->loadCount('articles'));
    }

    /** POST { password }: kata sandi sementara baru; sesi pengguna itu yang berjalan berakhir. */
    public function resetPassword(ResetPasswordRequest $request, User $user): ManagedUserResource
    {
        throw_if($user->is(auth()->user()), ValidationException::withMessages([
            'password' => 'Ganti kata sandi Anda sendiri di menu Akun saya.',
        ]));

        $user->password = $request->string('password')->value();
        $user->must_change_password = true;
        $user->save();

        ActivityLog::record(ActivityAction::PenggunaSandiDiaturUlang, "Mengatur ulang kata sandi akun {$user->email}.", $user);

        return new ManagedUserResource($user->loadCount('articles'));
    }

    /**
     * Admin terakhir yang aktif tidak boleh diturunkan atau dinonaktifkan: panel tidak akan punya
     * pengelola lagi. Diperiksa di dalam transaksi pada baris yang dikunci agar dua perubahan
     * bersamaan tidak sama-sama lolos.
     */
    private function ensureAnotherActiveAdminRemains(User $user, Role $newRole, bool $newActive): void
    {
        $staysActiveAdmin = $newRole === Role::Admin && $newActive;
        if ($staysActiveAdmin || ! ($user->isAdmin() && $user->is_active)) {
            return;
        }

        $others = User::query()
            ->where('role', Role::Admin->value)
            ->where('is_active', true)
            ->whereKeyNot($user->getKey())
            ->lockForUpdate()
            ->exists();

        abort_unless($others, 409, 'Minimal satu Admin aktif harus tersisa.');
    }
}
