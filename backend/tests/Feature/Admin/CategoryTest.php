<?php

namespace Tests\Feature\Admin;

use App\Models\ActivityLog;
use App\Models\Article;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_everyone_in_the_cms_can_list_categories_with_article_counts(): void
    {
        $used = Category::factory()->create(['name' => 'Layanan Publik']);
        Category::factory()->create(['name' => 'Kebijakan']);
        Article::factory()->for($used)->count(2)->create();
        Article::factory()->for($used)->create()->delete();

        $this->actingAs(User::factory()->create())->getJson('/api/admin/categories')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Kebijakan')
            ->assertJsonPath('data.0.articles_count', 0)
            ->assertJsonPath('data.1.name', 'Layanan Publik')
            ->assertJsonPath('data.1.articles_count', 3);
    }

    public function test_admin_creates_renames_and_deletes_categories(): void
    {
        $admin = User::factory()->admin()->create();

        $id = $this->actingAs($admin)->postJson('/api/admin/categories', ['name' => '  Kebijakan & Regulasi '])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Kebijakan & Regulasi')
            ->assertJsonPath('data.slug', 'kebijakan-regulasi')
            ->json('data.id');

        $this->actingAs($admin)->putJson("/api/admin/categories/{$id}", ['name' => 'Regulasi'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Regulasi')
            ->assertJsonPath('data.slug', 'kebijakan-regulasi');

        $this->actingAs($admin)->deleteJson("/api/admin/categories/{$id}")->assertNoContent();
        $this->assertDatabaseMissing('categories', ['id' => $id]);
        $this->assertSame(
            ['kategori_dibuat', 'kategori_diperbarui', 'kategori_dihapus'],
            ActivityLog::orderBy('id')->pluck('action')->all(),
        );
    }

    public function test_names_must_be_unique(): void
    {
        Category::factory()->create(['name' => 'Layanan Publik']);

        $this->actingAs(User::factory()->admin()->create())
            ->postJson('/api/admin/categories', ['name' => 'Layanan Publik'])
            ->assertUnprocessable()
            ->assertJsonPath('errors.name.0', 'Kategori dengan nama ini sudah ada.');
    }

    public function test_category_in_use_cannot_be_deleted_even_by_trashed_articles(): void
    {
        $category = Category::factory()->create();
        Article::factory()->for($category)->create()->delete();

        $this->actingAs(User::factory()->admin()->create())
            ->deleteJson("/api/admin/categories/{$category->id}")
            ->assertConflict()
            ->assertJsonPath('message', 'Kategori ini masih dipakai 1 artikel (termasuk yang di sampah). Pindahkan artikelnya ke kategori lain terlebih dahulu.');

        $this->assertModelExists($category);
    }

    public function test_penulis_cannot_change_categories(): void
    {
        $category = Category::factory()->create();
        $penulis = User::factory()->create();

        $this->actingAs($penulis)->postJson('/api/admin/categories', ['name' => 'Baru'])->assertForbidden();
        $this->actingAs($penulis)->putJson("/api/admin/categories/{$category->id}", ['name' => 'Ganti'])->assertForbidden();
        $this->actingAs($penulis)->deleteJson("/api/admin/categories/{$category->id}")->assertForbidden();
    }
}
