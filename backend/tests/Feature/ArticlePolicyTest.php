<?php

namespace Tests\Feature;

use App\Enums\ArticleStatus;
use App\Enums\Role;
use App\Models\Article;
use App\Models\User;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Matriks hak akses artikel per peran, kepemilikan, dan status (tanpa database).
 */
class ArticlePolicyTest extends TestCase
{
    private const OWNER_ID = 1;

    private const OTHER_ID = 2;

    private function user(Role $role, int $id): User
    {
        $user = new User;
        $user->forceFill(['id' => $id, 'role' => $role, 'is_active' => true]);

        return $user;
    }

    private function article(ArticleStatus $status): Article
    {
        $article = new Article;
        $article->forceFill(['author_id' => self::OWNER_ID, 'status' => $status]);

        return $article;
    }

    /**
     * [aksi, status artikel, admin?, penulis pemilik?, penulis lain?]
     *
     * @return array<string, array{string, ArticleStatus, bool, bool, bool}>
     */
    public static function matrix(): array
    {
        $d = ArticleStatus::Draf;
        $t = ArticleStatus::Ditinjau;
        $p = ArticleStatus::Terbit;

        return [
            'lihat draf' => ['view', $d, true, true, false],
            'edit draf' => ['update', $d, true, true, false],
            'edit saat ditinjau' => ['update', $t, true, false, false],
            'edit yang terbit' => ['update', $p, true, false, false],
            'hapus draf' => ['delete', $d, true, false, false],
            'hapus yang terbit' => ['delete', $p, true, false, false],
            'pulihkan' => ['restore', $d, true, false, false],
            'hapus permanen' => ['forceDelete', $d, true, false, false],
            'ajukan draf' => ['submit', $d, true, true, false],
            'ajukan ulang yang ditinjau' => ['submit', $t, false, false, false],
            'tarik pengajuan' => ['withdraw', $t, true, true, false],
            'tarik draf' => ['withdraw', $d, false, false, false],
            'terbitkan draf' => ['publish', $d, true, false, false],
            'terbitkan yang ditinjau' => ['publish', $t, true, false, false],
            'terbitkan ulang yang terbit' => ['publish', $p, false, false, false],
            'kembalikan yang ditinjau' => ['return', $t, true, false, false],
            'kembalikan draf' => ['return', $d, false, false, false],
            'batalkan terbit' => ['unpublish', $p, true, false, false],
            'batalkan terbit draf' => ['unpublish', $d, false, false, false],
        ];
    }

    #[DataProvider('matrix')]
    public function test_article_permissions(string $ability, ArticleStatus $status, bool $admin, bool $owner, bool $other): void
    {
        $article = $this->article($status);

        $this->assertSame($admin, $this->user(Role::Admin, 99)->can($ability, $article), 'Admin');
        $this->assertSame($owner, $this->user(Role::Penulis, self::OWNER_ID)->can($ability, $article), 'Penulis pemilik');
        $this->assertSame($other, $this->user(Role::Penulis, self::OTHER_ID)->can($ability, $article), 'Penulis lain');
    }

    public function test_everyone_can_create_and_list_articles(): void
    {
        foreach ([Role::Admin, Role::Penulis] as $role) {
            $this->assertTrue($this->user($role, 5)->can('create', Article::class));
            $this->assertTrue($this->user($role, 5)->can('viewAny', Article::class));
        }
    }

    public function test_admin_gate_is_only_for_admins(): void
    {
        $this->assertTrue($this->user(Role::Admin, 1)->can('admin'));
        $this->assertFalse($this->user(Role::Penulis, 1)->can('admin'));
    }
}
