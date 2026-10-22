<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Media;
use App\Support\MediaStorage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CleanOrphanMediaCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    private function upload(int $daysOld): Media
    {
        $media = app(MediaStorage::class)->store(UploadedFile::fake()->image('foto.jpg', 800, 600), null);
        $media->forceFill(['created_at' => now()->subDays($daysOld)])->save();

        return $media;
    }

    private function assertStored(Media $media, bool $exists): void
    {
        $this->assertSame($exists, Storage::disk('public')->exists($media->path));
        $this->assertSame($exists, Storage::disk('public')->exists($media->og_path));
        $this->assertSame($exists, Media::query()->whereKey($media->id)->exists());
    }

    public function test_removes_old_unused_images_with_both_files(): void
    {
        $orphan = $this->upload(daysOld: 10);

        $this->artisan('pemdi:bersihkan-media')->expectsOutput('Gambar tak terpakai dihapus: 1.')->assertSuccessful();

        $this->assertStored($orphan, false);
    }

    public function test_keeps_recent_uploads_during_the_grace_period(): void
    {
        $recent = $this->upload(daysOld: 1);

        $this->artisan('pemdi:bersihkan-media')->expectsOutput('Gambar tak terpakai dihapus: 0.')->assertSuccessful();

        $this->assertStored($recent, true);
    }

    public function test_keeps_images_used_as_cover_or_in_the_body_even_for_trashed_articles(): void
    {
        $cover = $this->upload(daysOld: 30);
        $inBody = $this->upload(daysOld: 30);
        $inTrashed = $this->upload(daysOld: 30);
        $orphan = $this->upload(daysOld: 30);

        Article::factory()->create(['cover_url' => $cover->ogUrl()]);
        Article::factory()->create(['body_html' => '<p>Teks</p><img src="'.$inBody->url().'" alt="">']);
        Article::factory()->create(['body_html' => '<img src="'.$inTrashed->url().'" alt="">'])->delete();

        $this->artisan('pemdi:bersihkan-media')->expectsOutput('Gambar tak terpakai dihapus: 1.')->assertSuccessful();

        $this->assertStored($cover, true);
        $this->assertStored($inBody, true);
        $this->assertStored($inTrashed, true);
        $this->assertStored($orphan, false);
    }

    public function test_an_image_is_removed_once_the_article_that_used_it_is_gone(): void
    {
        $media = $this->upload(daysOld: 30);
        $article = Article::factory()->create(['cover_url' => $media->url()]);

        $this->artisan('pemdi:bersihkan-media')->assertSuccessful();
        $this->assertStored($media, true);

        $article->forceDelete();
        $this->artisan('pemdi:bersihkan-media')->assertSuccessful();
        $this->assertStored($media, false);
    }
}
