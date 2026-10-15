<?php

namespace Tests\Feature\Admin;

use App\Enums\ArticleStatus;
use App\Models\ActivityLog;
use App\Models\Article;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ArticleWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_full_review_cycle_between_penulis_and_admin(): void
    {
        $penulis = User::factory()->create();
        $admin = User::factory()->admin()->create();
        $article = Article::factory()->for($penulis, 'author')->create();

        // Penulis mengajukan; tidak bisa lagi mengedit atau menerbitkan sendiri.
        $this->actingAs($penulis)->postJson("/api/admin/articles/{$article->id}/submit")
            ->assertOk()
            ->assertJsonPath('data.status', 'ditinjau')
            ->assertJsonPath('data.status_label', 'Menunggu tinjauan')
            ->assertJsonPath('data.can.update', false)
            ->assertJsonPath('data.can.withdraw', true);
        $this->actingAs($penulis)->postJson("/api/admin/articles/{$article->id}/publish")->assertForbidden();

        // Admin mengembalikan dengan catatan.
        $this->actingAs($admin)->postJson("/api/admin/articles/{$article->id}/return", ['note' => '  Tambahkan sumber data.  '])
            ->assertOk()
            ->assertJsonPath('data.status', 'draf')
            ->assertJsonPath('data.review_note', 'Tambahkan sumber data.');

        // Penulis memperbaiki lalu mengajukan ulang: catatan lama dihapus.
        $this->actingAs($penulis)->postJson("/api/admin/articles/{$article->id}/submit")
            ->assertOk()
            ->assertJsonPath('data.review_note', null);

        // Admin menerbitkan.
        $this->travelTo(now()->setDate(2026, 10, 13)->setTime(10, 0));
        $this->actingAs($admin)->postJson("/api/admin/articles/{$article->id}/publish")
            ->assertOk()
            ->assertJsonPath('data.status', 'terbit')
            ->assertJsonPath('data.published_at', '2026-10-13T10:00:00+00:00');

        $this->assertSame(
            ['artikel_diajukan', 'artikel_dikembalikan', 'artikel_diajukan', 'artikel_diterbitkan'],
            ActivityLog::where('subject_id', $article->id)->orderBy('id')->pluck('action')->all(),
        );
    }

    public function test_penulis_can_withdraw_a_pending_submission_to_edit_again(): void
    {
        $penulis = User::factory()->create();
        $article = Article::factory()->for($penulis, 'author')->inReview()->create();

        $this->actingAs($penulis)->postJson("/api/admin/articles/{$article->id}/withdraw")
            ->assertOk()
            ->assertJsonPath('data.status', 'draf')
            ->assertJsonPath('data.can.update', true);
    }

    public function test_return_requires_a_note(): void
    {
        $article = Article::factory()->inReview()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->postJson("/api/admin/articles/{$article->id}/return", ['note' => ''])
            ->assertUnprocessable()
            ->assertJsonPath('errors.note.0', 'Catatan perbaikan wajib diisi agar Penulis tahu apa yang harus diubah.');

        $this->assertSame(ArticleStatus::Ditinjau, $article->fresh()?->status);
    }

    public function test_unpublish_and_republish_keep_the_original_publish_date(): void
    {
        $admin = User::factory()->admin()->create();
        $article = Article::factory()->published()->create(['published_at' => '2025-01-24 02:00:00']);

        $this->actingAs($admin)->postJson("/api/admin/articles/{$article->id}/unpublish")->assertOk()->assertJsonPath('data.status', 'draf');
        $this->assertSame(0, Article::published()->count());

        $this->actingAs($admin)->postJson("/api/admin/articles/{$article->id}/publish")
            ->assertOk()
            ->assertJsonPath('data.published_at', '2025-01-24T02:00:00+00:00');
    }

    /** @return array<string, array{string, string}> */
    public static function invalidTransitions(): array
    {
        return [
            'ajukan yang sudah terbit' => ['submit', 'published'],
            'tarik draf' => ['withdraw', 'draft'],
            'kembalikan draf' => ['return', 'draft'],
            'terbitkan ulang yang terbit' => ['publish', 'published'],
            'batalkan terbit draf' => ['unpublish', 'draft'],
        ];
    }

    #[DataProvider('invalidTransitions')]
    public function test_invalid_transitions_are_refused_even_for_admin(string $action, string $state): void
    {
        $article = $state === 'published' ? Article::factory()->published()->create() : Article::factory()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->postJson("/api/admin/articles/{$article->id}/{$action}", ['note' => 'Catatan cukup panjang'])
            ->assertForbidden();
    }

    public function test_trashed_articles_cannot_go_through_the_workflow(): void
    {
        $article = Article::factory()->inReview()->create();
        $article->delete();

        $this->actingAs(User::factory()->admin()->create())
            ->postJson("/api/admin/articles/{$article->id}/publish")
            ->assertNotFound();
    }
}
