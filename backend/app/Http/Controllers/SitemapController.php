<?php

namespace App\Http\Controllers;

use App\Models\Article;
use Illuminate\Http\Response;

/**
 * sitemap.xml untuk mesin pencari: halaman statis situs publik dan semua artikel terbit, dengan URL
 * absolut dari APP_URL (di produksi wajib berisi alamat situs, mis. https://pemdi.panrb.go.id).
 */
class SitemapController extends Controller
{
    private const STATIC_PATHS = ['/', '/portfolio', '/contact'];

    public function __invoke(): Response
    {
        $base = rtrim((string) config('app.url'), '/');
        $entries = array_map(fn (string $path): string => $this->entry($base.$path), self::STATIC_PATHS);

        Article::query()
            ->published()
            ->latest('published_at')
            ->select(['slug', 'updated_at'])
            ->each(function (Article $article) use ($base, &$entries): void {
                $entries[] = $this->entry(
                    $base.'/portfolio/'.rawurlencode($article->slug),
                    $article->updated_at?->toDateString(),
                );
            });

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n"
            .'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n"
            .implode("\n", $entries)."\n"
            .'</urlset>'."\n";

        return response($xml, 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
    }

    private function entry(string $url, ?string $lastModified = null): string
    {
        $loc = '<loc>'.htmlspecialchars($url, ENT_XML1 | ENT_QUOTES, 'UTF-8').'</loc>';
        $lastmod = $lastModified !== null ? "<lastmod>{$lastModified}</lastmod>" : '';

        return "  <url>{$loc}{$lastmod}</url>";
    }
}
