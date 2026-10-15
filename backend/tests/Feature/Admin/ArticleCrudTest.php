<?php

namespace Tests\Feature\Admin;

use App\Enums\ArticleStatus;
use App\Models\Article;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ArticleCrudTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return [
            'title' => 'Integrasi Layanan Digital ASN',
            'excerpt' => 'Ringkasan artikel tentang integrasi layanan digital bagi ASN.',
            'body_html' => '<h2>Latar</h2><p>Isi <strong>artikel</strong>.</p>',
            'category_id' => Category::factory()->create()->id,
            ...$overrides,
        ];
    }

    public function test_penulis_creates_a_draft_owned_by_them_with_generated_slug(): void
    {
        $penulis = User::factory()->create(['name' => 'Siti']);

        $response = $this->actingAs($penulis)->postJson('/api/admin/articles', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.slug', 'integrasi-layanan-digital-asn')
            ->assertJsonPath('data.status', 'draf')
            ->assertJsonPath('data.author.name', 'Siti')
            ->assertJsonPath('data.body_html', '<h2>Latar</h2><p>Isi <strong>artikel</strong>.</p>')
            ->assertJsonPath('data.can.update', true)
            ->assertJsonPath('data.can.publish', false)
            ->assertJsonPath('data.can.submit', true);

        $article = Article::findOrFail($response->json('data.id'));
        $this->assertTrue($article->isOwnedBy($penulis));
        $this->assertDatabaseHas('activity_logs', ['action' => 'artikel_dibuat', 'user_id' => $penulis->id, 'subject_id' => $article->id]);
    }

    public function test_status_author_and_publish_date_cannot_be_set_from_the_form(): void
    {
        $penulis = User::factory()->create();
        $other = User::factory()->create();

        $response = $this->actingAs($penulis)->postJson('/api/admin/articles', $this->payload([
            'status' => 'terbit', 'author_id' => $other->id, 'published_at' => '2020-01-01', 'review_note' => 'x',
        ]))->assertCreated();

        $article = Article::findOrFail($response->json('data.id'));
        $this->assertSame(ArticleStatus::Draf, $article->status);
        $this->assertSame($penulis->id, $article->author_id);
        $this->assertNull($article->published_at);
        $this->assertNull($article->review_note);
    }

    public function test_body_is_sanitized_before_saving(): void
    {
        $response = $this->actingAs(User::factory()->create())->postJson('/api/admin/articles', $this->payload([
            'body_html' => '<p onclick="alert(1)">Aman</p><script>alert(1)</script><img src="https://pelacak.example/p.gif">',
        ]))->assertCreated();

        $this->assertSame('<p>Aman</p><img />', Article::findOrFail($response->json('data.id'))->body_html);
    }

    public function test_body_that_is_empty_after_sanitizing_is_rejected(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson('/api/admin/articles', $this->payload(['body_html' => '<script>alert(1)</script><p>&nbsp;</p>']))
            ->assertUnprocessable()
            ->assertJsonPath('errors.body_html.0', 'Isi artikel wajib diisi.');
    }

    public function test_validation_messages_are_in_indonesian(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson('/api/admin/articles', ['title' => 'abc', 'slug' => 'Bukan Slug!', 'excerpt' => 'pendek', 'cover_url' => 'https://situs-lain.example/a.jpg'])
            ->assertUnprocessable()
            ->assertJsonPath('errors.title.0', 'Judul minimal 5 karakter.')
            ->assertJsonPath('errors.slug.0', 'Slug hanya boleh huruf kecil, angka, dan tanda hubung (mis. layanan-digital-asn).')
            ->assertJsonPath('errors.excerpt.0', 'Ringkasan minimal 20 karakter.')
            ->assertJsonPath('errors.body_html.0', 'Isi artikel wajib diisi.')
            ->assertJsonPath('errors.category_id.0', 'Kategori wajib dipilih.')
            ->assertJsonPath('errors.cover_url.0', 'Gambar sampul harus berasal dari unggahan CMS.');
    }

    public function test_generated_slugs_stay_unique_including_trashed_articles(): void
    {
        $user = User::factory()->admin()->create();
        Article::factory()->create(['slug' => 'integrasi-layanan-digital-asn'])->delete();
        Article::factory()->create(['slug' => 'integrasi-layanan-digital-asn-2']);

        $this->actingAs($user)->postJson('/api/admin/articles', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.slug', 'integrasi-layanan-digital-asn-3');
    }

    public function test_explicit_slug_must_be_unique(): void
    {
        Article::factory()->create(['slug' => 'sudah-ada']);

        $this->actingAs(User::factory()->create())
            ->postJson('/api/admin/articles', $this->payload(['slug' => 'sudah-ada']))
            ->assertUnprocessable()
            ->assertJsonPath('errors.slug.0', 'Slug ini sudah dipakai artikel lain.');
    }

    public function test_cover_from_own_uploads_or_bundled_images_is_accepted(): void
    {
        $user = User::factory()->create();
        foreach (['/storage/media/0b8f0c7e-6f1a-4c37-9d55-3c1f2c0f9a10.webp', '/images/articles/article-1.webp'] as $i => $cover) {
            $this->actingAs($user)->postJson('/api/admin/articles', $this->payload(['title' => "Artikel sampul {$i}", 'cover_url' => $cover]))
                ->assertCreated()
                ->assertJsonPath('data.cover_url', $cover);
        }
    }

    public function test_updating_keeps_the_slug_when_the_title_changes(): void
    {
        $penulis = User::factory()->create();
        $article = Article::factory()->for($penulis, 'author')->create(['slug' => 'judul-lama']);

        $this->actingAs($penulis)->putJson("/api/admin/articles/{$article->id}", $this->payload(['title' => 'Judul yang baru sama sekali']))
            ->assertOk()
            ->assertJsonPath('data.title', 'Judul yang baru sama sekali')
            ->assertJsonPath('data.slug', 'judul-lama');

        $this->assertDatabaseHas('activity_logs', ['action' => 'artikel_diperbarui', 'subject_id' => $article->id]);
    }

    public function test_concurrent_edit_is_rejected_instead_of_silently_overwriting(): void
    {
        $admin = User::factory()->admin()->create();
        $article = Article::factory()->create();
        $openedAt = $article->updated_at->toIso8601String();
        $this->travel(5)->minutes();
        $article->touch(); // diubah orang lain setelah formulir dibuka

        $this->actingAs($admin)->putJson("/api/admin/articles/{$article->id}", $this->payload(['updated_at' => $openedAt]))
            ->assertConflict()
            ->assertJsonPath('message', 'Artikel ini sudah diubah pengguna lain sejak Anda membukanya. Muat ulang halaman untuk melihat versi terbaru.');

        $this->actingAs($admin)->putJson("/api/admin/articles/{$article->id}", $this->payload(['updated_at' => $article->fresh()->updated_at->toIso8601String()]))
            ->assertOk();
    }

    public function test_penulis_cannot_touch_articles_of_others_or_outside_draft(): void
    {
        $penulis = User::factory()->create();
        $others = Article::factory()->create();
        $ownInReview = Article::factory()->for($penulis, 'author')->inReview()->create();

        $this->actingAs($penulis)->getJson("/api/admin/articles/{$others->id}")->assertForbidden()
            ->assertJsonPath('message', 'Anda tidak memiliki akses untuk tindakan ini.');
        $this->actingAs($penulis)->putJson("/api/admin/articles/{$others->id}", $this->payload())->assertForbidden();
        $this->actingAs($penulis)->putJson("/api/admin/articles/{$ownInReview->id}", $this->payload())->assertForbidden();
        $this->actingAs($penulis)->deleteJson("/api/admin/articles/{$ownInReview->id}")->assertForbidden();
    }

    public function test_admin_can_edit_a_published_article_and_it_stays_published(): void
    {
        $article = Article::factory()->published()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->putJson("/api/admin/articles/{$article->id}", $this->payload())
            ->assertOk()
            ->assertJsonPath('data.status', 'terbit');
    }

    public function test_list_is_filtered_by_role_status_category_and_search(): void
    {
        $penulis = User::factory()->create();
        $category = Category::factory()->create();
        Article::factory()->for($penulis, 'author')->create(['title' => 'Draf milik saya tentang SPBE']);
        Article::factory()->for($penulis, 'author')->published()->for($category)->create(['title' => 'Terbit milik saya']);
        Article::factory()->published()->create(['title' => 'Milik orang lain tentang SPBE']);

        $this->actingAs($penulis)->getJson('/api/admin/articles')->assertOk()->assertJsonCount(2, 'data');
        $this->actingAs($penulis)->getJson('/api/admin/articles?status=terbit')->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Terbit milik saya')
            ->assertJsonMissingPath('data.0.body_html');

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin)->getJson('/api/admin/articles')->assertJsonCount(3, 'data')->assertJsonPath('meta.total', 3);
        $this->actingAs($admin)->getJson('/api/admin/articles?cari=SPBE')->assertJsonCount(2, 'data');
        $this->actingAs($admin)->getJson("/api/admin/articles?kategori={$category->id}")->assertJsonCount(1, 'data');
        // Karakter wildcard SQL dalam pencarian diperlakukan sebagai teks biasa.
        $this->actingAs($admin)->getJson('/api/admin/articles?cari=%25')->assertJsonCount(0, 'data');
    }

    public function test_trash_is_admin_only_and_supports_restore_and_permanent_delete(): void
    {
        $admin = User::factory()->admin()->create();
        $article = Article::factory()->published()->create(['title' => 'Akan dihapus']);

        $this->actingAs($admin)->deleteJson("/api/admin/articles/{$article->id}")->assertNoContent();
        $this->assertSoftDeleted($article);
        $this->actingAs($admin)->getJson('/api/admin/articles')->assertJsonCount(0, 'data');
        $this->actingAs($admin)->getJson('/api/admin/articles?status=sampah')->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.can.restore', true)
            ->assertJsonPath('data.0.can.update', false);
        $this->actingAs(User::factory()->create())->getJson('/api/admin/articles?status=sampah')->assertForbidden();

        $this->actingAs($admin)->postJson("/api/admin/articles/{$article->id}/restore")->assertOk()->assertJsonPath('data.status', 'terbit');
        $this->assertNotSoftDeleted($article);

        $this->actingAs($admin)->deleteJson("/api/admin/articles/{$article->id}/permanent")->assertConflict();
        $article->delete();
        $this->actingAs($admin)->deleteJson("/api/admin/articles/{$article->id}/permanent")->assertNoContent();
        $this->assertModelMissing($article);
        $this->assertDatabaseHas('activity_logs', ['action' => 'artikel_dihapus_permanen', 'description' => 'Menghapus permanen artikel "Akan dihapus".']);
    }

    public function test_non_numeric_and_missing_ids_return_404(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->getJson('/api/admin/articles/abc')->assertNotFound();
        $this->actingAs($admin)->getJson('/api/admin/articles/999')->assertNotFound();
    }

    public function test_guests_cannot_reach_article_endpoints(): void
    {
        $this->getJson('/api/admin/articles')->assertUnauthorized();
        $this->postJson('/api/admin/articles', [])->assertUnauthorized();
    }
}
