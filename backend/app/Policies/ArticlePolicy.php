<?php

namespace App\Policies;

use App\Enums\ArticleStatus;
use App\Models\Article;
use App\Models\User;

/**
 * Hak akses artikel (maker-checker):
 * - Penulis: membuat, mengedit draf miliknya, mengajukan/menarik tinjauan artikel miliknya.
 * - Admin: semua aksi, termasuk menerbitkan, mengembalikan, menghapus, dan memulihkan.
 * Pengguna nonaktif sudah ditolak middleware `active` sebelum sampai ke sini.
 */
class ArticlePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Article $article): bool
    {
        return $user->isAdmin() || $article->isOwnedBy($user);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Article $article): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $article->isOwnedBy($user) && $article->status === ArticleStatus::Draf;
    }

    public function delete(User $user, Article $article): bool
    {
        return $user->isAdmin();
    }

    public function restore(User $user, Article $article): bool
    {
        return $user->isAdmin();
    }

    public function forceDelete(User $user, Article $article): bool
    {
        return $user->isAdmin();
    }

    /** Mengajukan draf untuk ditinjau Admin. */
    public function submit(User $user, Article $article): bool
    {
        return ($user->isAdmin() || $article->isOwnedBy($user))
            && $article->status === ArticleStatus::Draf;
    }

    /** Menarik kembali pengajuan yang belum ditinjau agar bisa diedit lagi. */
    public function withdraw(User $user, Article $article): bool
    {
        return ($user->isAdmin() || $article->isOwnedBy($user))
            && $article->status === ArticleStatus::Ditinjau;
    }

    public function publish(User $user, Article $article): bool
    {
        return $user->isAdmin() && $article->status !== ArticleStatus::Terbit;
    }

    /** Mengembalikan pengajuan ke Penulis dengan catatan perbaikan. */
    public function return(User $user, Article $article): bool
    {
        return $user->isAdmin() && $article->status === ArticleStatus::Ditinjau;
    }

    public function unpublish(User $user, Article $article): bool
    {
        return $user->isAdmin() && $article->status === ArticleStatus::Terbit;
    }
}
