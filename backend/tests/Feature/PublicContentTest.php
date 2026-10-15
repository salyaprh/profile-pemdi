<?php

namespace Tests\Feature;

use App\Enums\ArticleStatus;
use App\Models\Article;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/**
 * API situs publik (routes/public.php). Kontrak bentuk respons dijaga sama dengan
 * frontend/src/services/content.ts.
 */
class PublicContentTest extends TestCase
{
    use RefreshDatabase;

    /** @param  array<string, mixed>  $attributes */
    private function published(array $attributes = []): Article
    {
        return Article::factory()->published()->create($attributes);
    }

    /**
     * @param  TestResponse<JsonResponse>  $response
     * @return list<string>
     */
    private function slugs(TestResponse $response): array
    {
        return array_column($response->json('data'), 'slug');
    }

    public function test_only_published_articles_are_listed_newest_first(): void
    {
        $older = $this->published(['published_at' => now()->subDays(3)]);
        $newer = $this->published(['published_at' => now()->subDay()]);
        Article::factory()->create(); // draf
        Article::factory()->inReview()->create();
        $this->published()->delete(); // di sampah
        // Status terbit tetapi tanggal terbitnya di masa depan.
        Article::factory()->create(['status' => ArticleStatus::Terbit, 'published_at' => now()->addDay()]);

        $response = $this->getJson('/api/articles')->assertOk();

        $this->assertSame([$newer->slug, $older->slug], $this->slugs($response));
        $response->assertJsonPath('meta', ['current_page' => 1, 'last_page' => 1, 'per_page' => 12, 'total' => 2]);
    }

    public function test_list_exposes_only_public_fields(): void
    {
        $author = User::factory()->create(['name' => 'Siti Rahma', 'email' => 'siti@pemdi.test']);
        $category = Category::factory()->create(['name' => 'Layanan Publik', 'slug' => 'layanan-publik']);
        $article = $this->published([
            'author_id' => $author->id,
            'category_id' => $category->id,
            'cover_url' => '/images/articles/article-1.webp',
            'published_at' => Carbon::parse('2025-01-24 02:00:00', 'UTC'),
        ]);

        $response = $this->getJson('/api/articles')->assertOk();

        $this->assertSame([
            'slug' => $article->slug,
            'title' => $article->title,
            'excerpt' => $article->excerpt,
            'cover_url' => '/images/articles/article-1.webp',
            'published_at' => '2025-01-24T02:00:00+00:00',
            'category' => ['name' => 'Layanan Publik', 'slug' => 'layanan-publik'],
            'author' => ['name' => 'Siti Rahma'],
        ], $response->json('data.0'));
        $this->assertSame(['data', 'meta'], array_keys($response->json()));
        $this->assertStringNotContainsString('siti@pemdi.test', $response->getContent());
    }

    public function test_pagination_and_per_page_bounds(): void
    {
        Article::factory()->published()->count(15)->create();

        $this->getJson('/api/articles?page=2')->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.last_page', 2);
        $this->getJson('/api/articles?per_page=3')->assertJsonCount(3, 'data')->assertJsonPath('meta.last_page', 5);
        $this->getJson('/api/articles?per_page=1000')->assertJsonPath('meta.per_page', 24);
        $this->getJson('/api/articles?per_page=0')->assertJsonPath('meta.per_page', 1);
        $this->getJson('/api/articles?per_page=abc')->assertJsonPath('meta.per_page', 12);
    }

    public function test_filters_by_category_slug(): void
    {
        $guide = Category::factory()->create(['slug' => 'panduan-pengguna']);
        $inGuide = $this->published(['category_id' => $guide->id]);
        $this->published();

        $this->assertSame([$inGuide->slug], $this->slugs($this->getJson('/api/articles?kategori=panduan-pengguna')));
        $this->getJson('/api/articles?kategori=tidak-ada')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_search_matches_title_or_excerpt_case_insensitively_and_literally(): void
    {
        $byTitle = $this->published(['title' => 'Integrasi Layanan INAgov']);
        $byExcerpt = $this->published(['title' => 'Kabar lain', 'excerpt' => 'Membahas layanan inagov untuk ASN di daerah.']);
        $this->published(['title' => 'Topik berbeda', 'excerpt' => 'Tidak berkaitan dengan kata kunci sama sekali.']);
        $percent = $this->published(['title' => 'Capaian 100% digital', 'excerpt' => 'Ringkasan capaian layanan digital tahun ini.']);
        $this->published(['title' => 'Capaian 1000 layanan', 'excerpt' => 'Ringkasan capaian ribuan layanan pemerintah.']);

        $found = $this->slugs($this->getJson('/api/articles?cari=INAGOV'));
        $this->assertEqualsCanonicalizing([$byTitle->slug, $byExcerpt->slug], $found);
        // "%" dicari apa adanya, bukan sebagai wildcard.
        $this->assertSame([$percent->slug], $this->slugs($this->getJson('/api/articles?cari='.urlencode('100%'))));
        // Draf tidak ikut dicari.
        Article::factory()->create(['title' => 'Draf INAgov rahasia']);
        $this->assertCount(2, $this->slugs($this->getJson('/api/articles?cari=inagov')));
    }

    public function test_article_detail_with_body_reading_time_and_related(): void
    {
        $category = Category::factory()->create();
        $article = $this->published([
            'category_id' => $category->id,
            'body_html' => '<p>'.str_repeat('kata ', 250).'</p><h2>Bagian</h2>',
            'source' => 'Biro Hubungan Masyarakat',
            'published_at' => now()->subDays(10),
        ]);
        $related = collect(range(1, 4))->map(fn (int $day) => $this->published([
            'category_id' => $category->id,
            'published_at' => now()->subDays($day),
        ]));
        $this->published(); // kategori lain
        Article::factory()->create(['category_id' => $category->id]); // draf sekategori

        $response = $this->getJson("/api/articles/{$article->slug}")->assertOk();

        $response->assertJsonPath('data.slug', $article->slug)
            ->assertJsonPath('data.body_html', $article->body_html)
            ->assertJsonPath('data.source', 'Biro Hubungan Masyarakat')
            ->assertJsonPath('data.reading_minutes', 2);
        // Tiga terbaru dari kategori yang sama, tanpa artikel ini sendiri.
        $this->assertSame(
            $related->take(3)->pluck('slug')->all(),
            array_column($response->json('related'), 'slug'),
        );
        $this->assertArrayNotHasKey('body_html', $response->json('related.0'));
    }

    public function test_unpublished_or_unknown_articles_are_404(): void
    {
        $draft = Article::factory()->create();
        $review = Article::factory()->inReview()->create();
        $trashed = $this->published();
        $trashed->delete();

        foreach ([$draft->slug, $review->slug, $trashed->slug, 'tidak-ada'] as $slug) {
            $this->getJson("/api/articles/{$slug}")
                ->assertNotFound()
                ->assertJsonPath('message', 'Artikel tidak ditemukan.');
        }
        $this->getJson('/api/articles/BUKAN%20SLUG')->assertNotFound();
    }

    public function test_categories_list_only_those_with_published_articles(): void
    {
        $service = Category::factory()->create(['name' => 'Layanan Publik', 'slug' => 'layanan-publik']);
        Category::factory()->create(['name' => 'Kosong']);
        $draftOnly = Category::factory()->create(['name' => 'Hanya draf']);
        $this->published(['category_id' => $service->id]);
        $this->published(['category_id' => $service->id]);
        Article::factory()->create(['category_id' => $service->id]);
        Article::factory()->create(['category_id' => $draftOnly->id]);

        $this->getJson('/api/categories')->assertOk()->assertExactJson([
            'data' => [['name' => 'Layanan Publik', 'slug' => 'layanan-publik', 'articles_count' => 2]],
        ]);
    }

    public function test_public_responses_have_no_cookies_or_cors_and_support_etag(): void
    {
        $this->published();

        $response = $this->getJson('/api/articles')->assertOk();

        $this->assertEmpty($response->headers->getCookies(), 'pengunjung situs tidak mendapat cookie');
        $this->assertNull($response->headers->get('Access-Control-Allow-Origin'));
        $this->assertStringContainsString('no-cache', (string) $response->headers->get('Cache-Control'));
        $etag = (string) $response->headers->get('ETag');
        $this->assertNotSame('', $etag);

        $this->getJson('/api/articles', ['If-None-Match' => $etag])->assertStatus(304);
        $this->getJson('/api/categories')->assertOk();
        $this->assertEmpty($this->getJson('/api/categories')->headers->getCookies());
    }

    public function test_public_api_is_rate_limited_per_ip(): void
    {
        config(['pemdi.public_rate_limit' => 5]);

        for ($i = 0; $i < 5; $i++) {
            $this->getJson('/api/categories')->assertOk();
        }

        $this->getJson('/api/categories')->assertStatus(429);
    }
}
