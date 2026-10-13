<?php

namespace Tests\Feature;

use App\Models\Article;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SitemapTest extends TestCase
{
    use RefreshDatabase;

    public function test_lists_static_pages_and_published_articles_with_absolute_urls(): void
    {
        config(['app.url' => 'https://pemdi.example.go.id/']);
        $published = Article::factory()->published()->create(['slug' => 'integrasi-layanan']);
        $draft = Article::factory()->create();
        $trashed = Article::factory()->published()->create();
        $trashed->delete();

        $response = $this->get('/sitemap.xml')->assertOk();

        $this->assertStringStartsWith('application/xml', (string) $response->headers->get('Content-Type'));
        preg_match_all('#<loc>([^<]+)</loc>#', (string) $response->getContent(), $matches);
        $this->assertSame([
            'https://pemdi.example.go.id/',
            'https://pemdi.example.go.id/portfolio',
            'https://pemdi.example.go.id/contact',
            'https://pemdi.example.go.id/portfolio/integrasi-layanan',
        ], $matches[1]);
        $this->assertStringContainsString('<lastmod>'.$published->updated_at?->toDateString().'</lastmod>', (string) $response->getContent());
        $this->assertStringNotContainsString($draft->slug, (string) $response->getContent());
        $this->assertEmpty($response->headers->getCookies());
    }
}
