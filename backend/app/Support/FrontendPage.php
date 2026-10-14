<?php

namespace App\Support;

use App\Models\Article;

/**
 * index.html hasil build frontend (config pemdi.frontend_index), dengan meta artikel disisipkan.
 * Meta statis tingkat situs di berkas itu diganti, bukan ditambah, agar tidak ada tag ganda.
 */
class FrontendPage
{
    public const HEADERS = ['Content-Type' => 'text/html; charset=UTF-8'];

    /** Tag yang digantikan meta artikel. */
    private const REPLACED = '#<title>.*?</title>|<meta\s[^>]*?(?:name|property)="(?:description|og:type|og:title|og:description|twitter:card)"[^>]*>#s';

    public function html(): string
    {
        $html = @file_get_contents((string) config('pemdi.frontend_index'));
        abort_if($html === false, 404);

        return $html;
    }

    public function forArticle(Article $article): string
    {
        $html = $this->html();
        $stripped = (string) preg_replace(self::REPLACED, '', $html);
        $head = strpos($stripped, '</head>');
        if ($head === false) {
            return $html;
        }

        $title = $article->title.' | '.config('app.name');
        $url = rtrim((string) config('app.url'), '/').'/portfolio/'.rawurlencode($article->slug);
        $image = $article->cover_url !== null ? $this->absolute(MediaUrl::previewImage($article->cover_url)) : null;

        $tags = [
            '<title>'.e($title).'</title>',
            $this->meta('name', 'description', $article->excerpt),
            '<link rel="canonical" href="'.e($url).'" />',
            $this->meta('property', 'og:type', 'article'),
            $this->meta('property', 'og:url', $url),
            $this->meta('property', 'og:title', $title),
            $this->meta('property', 'og:description', $article->excerpt),
            $this->meta('name', 'twitter:card', $image !== null ? 'summary_large_image' : 'summary'),
            ...($article->published_at !== null ? [$this->meta('property', 'article:published_time', $article->published_at->toIso8601String())] : []),
            ...($image !== null ? [$this->meta('property', 'og:image', $image), $this->meta('name', 'twitter:image', $image)] : []),
        ];

        return substr_replace($stripped, '    '.implode("\n    ", $tags)."\n  ", $head, 0);
    }

    private function meta(string $attribute, string $key, string $content): string
    {
        return '<meta '.$attribute.'="'.$key.'" content="'.e($content).'" />';
    }

    private function absolute(string $path): string
    {
        return rtrim((string) config('app.url'), '/').$path;
    }
}
