<?php

namespace Tests\Feature;

use App\Models\Article;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ArticlePageTest extends TestCase
{
    use RefreshDatabase;

    private const SHELL = <<<'HTML'
<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="description"
      content="Deskripsi situs"
    />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="PEMDI PANRB" />
    <meta property="og:title" content="Judul situs" />
    <meta property="og:description" content="Deskripsi og situs" />
    <meta name="twitter:card" content="summary" />
    <title>Judul situs</title>
    <script type="module" src="/assets/index-abc.js"></script>
  </head>
  <body><div id="root"></div></body>
</html>
HTML;

    private string $index;

    protected function setUp(): void
    {
        parent::setUp();
        $this->index = tempnam(sys_get_temp_dir(), 'pemdi-index');
        file_put_contents($this->index, self::SHELL);
        config(['pemdi.frontend_index' => $this->index, 'app.url' => 'https://pemdi.example.go.id', 'app.name' => 'PEMDI PANRB']);
    }

    protected function tearDown(): void
    {
        @unlink($this->index);
        parent::tearDown();
    }

    public function test_published_article_replaces_the_site_meta_with_its_own(): void
    {
        $article = Article::factory()->published()->create([
            'title' => 'Layanan "Terpadu" & <Cepat>',
            'slug' => 'layanan-terpadu',
            'excerpt' => 'Ringkasan <b>artikel</b> & "kutipan".',
        ]);

        $html = $this->get('/portfolio/'.$article->slug)->assertOk()->assertHeader('Content-Type', 'text/html; charset=UTF-8')->getContent();

        $this->assertSame(1, substr_count($html, '<title>'));
        $this->assertStringContainsString('<title>Layanan &quot;Terpadu&quot; &amp; &lt;Cepat&gt; | PEMDI PANRB</title>', $html);
        $this->assertStringContainsString('name="description" content="Ringkasan &lt;b&gt;artikel&lt;/b&gt; &amp; &quot;kutipan&quot;."', $html);
        $this->assertStringContainsString('<link rel="canonical" href="https://pemdi.example.go.id/portfolio/layanan-terpadu" />', $html);
        $this->assertStringContainsString('property="og:url" content="https://pemdi.example.go.id/portfolio/layanan-terpadu"', $html);
        $this->assertStringContainsString('property="og:type" content="article"', $html);
        $this->assertStringContainsString('name="twitter:card" content="summary"', $html);
        $this->assertStringNotContainsString('Deskripsi situs', $html);
        $this->assertStringNotContainsString('Judul situs', $html);
        $this->assertStringNotContainsString('og:image', $html);
        // Yang tidak diganti tetap ada: bahasa, skrip aplikasi, dan meta tingkat situs lainnya.
        $this->assertStringContainsString('<html lang="id">', $html);
        $this->assertStringContainsString('/assets/index-abc.js', $html);
        $this->assertStringContainsString('property="og:site_name"', $html);
    }

    public function test_uploaded_cover_uses_the_1200x630_variant_as_an_absolute_url(): void
    {
        $uuid = 'aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb';
        $article = Article::factory()->published()->create(['cover_url' => "/storage/media/{$uuid}.webp"]);

        $html = $this->get('/portfolio/'.$article->slug)->assertOk()->getContent();

        $this->assertStringContainsString("property=\"og:image\" content=\"https://pemdi.example.go.id/storage/media/{$uuid}-og.webp\"", $html);
        $this->assertStringContainsString('name="twitter:card" content="summary_large_image"', $html);
        $this->assertStringContainsString("name=\"twitter:image\" content=\"https://pemdi.example.go.id/storage/media/{$uuid}-og.webp\"", $html);
    }

    public function test_bundled_cover_is_used_as_is(): void
    {
        $article = Article::factory()->published()->create(['cover_url' => '/images/articles/foto.webp']);

        $this->get('/portfolio/'.$article->slug)->assertOk()
            ->assertSee('property="og:image" content="https://pemdi.example.go.id/images/articles/foto.webp"', false);
    }

    public function test_unknown_draft_and_trashed_articles_get_the_untouched_page_with_404(): void
    {
        $draft = Article::factory()->create();
        $trashed = Article::factory()->published()->create();
        $trashed->delete();

        // Termasuk slug yang terlalu panjang atau berformat lain.
        foreach (['tidak-ada', $draft->slug, $trashed->slug, 'Huruf-Besar', str_repeat('a', 300)] as $slug) {
            $response = $this->get('/portfolio/'.$slug)->assertNotFound();
            $this->assertSame(self::SHELL, $response->getContent());
        }
    }

    public function test_page_is_revalidated_and_sets_no_cookie(): void
    {
        $article = Article::factory()->published()->create();

        $response = $this->get('/portfolio/'.$article->slug)->assertOk();

        $this->assertStringContainsString('no-cache', (string) $response->headers->get('Cache-Control'));
        $this->assertNotNull($response->headers->get('ETag'));
        $this->assertCount(0, $response->headers->getCookies());
    }

    public function test_missing_frontend_build_is_a_404_not_an_error(): void
    {
        config(['pemdi.frontend_index' => '/tidak/ada/index.html']);

        $this->get('/portfolio/apa-saja')->assertNotFound();
    }
}
