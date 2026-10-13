<?php

namespace Tests\Feature;

use App\Support\ArticleHtmlSanitizer;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ArticleHtmlSanitizerTest extends TestCase
{
    private const MEDIA = '/storage/media/0b8f0c7e-6f1a-4c37-9d55-3c1f2c0f9a10.webp';

    private function clean(string $html): string
    {
        return (new ArticleHtmlSanitizer)->sanitize($html);
    }

    public function test_keeps_everything_the_editor_toolbar_can_produce(): void
    {
        $html = '<h2>Subjudul</h2><h3>Bagian</h3>'
            .'<p>Teks <strong>tebal</strong> <em>miring</em> <u>garis</u> <s>coret</s><br>baris baru</p>'
            .'<ul><li><p>poin</p></li></ul><ol><li><p>nomor</p></li></ol>'
            .'<blockquote><p>kutipan</p></blockquote><hr>'
            .'<p><a href="https://www.menpan.go.id/" title="PANRB">PANRB</a> <a href="/portfolio">portofolio</a> <a href="mailto:humas@menpan.go.id">surel</a></p>'
            .'<img src="'.self::MEDIA.'" alt="Foto kegiatan">';

        $this->assertSame(
            '<h2>Subjudul</h2><h3>Bagian</h3>'
            .'<p>Teks <strong>tebal</strong> <em>miring</em> <u>garis</u> <s>coret</s><br />baris baru</p>'
            .'<ul><li><p>poin</p></li></ul><ol><li><p>nomor</p></li></ol>'
            .'<blockquote><p>kutipan</p></blockquote><hr />'
            .'<p><a href="https://www.menpan.go.id/" title="PANRB" rel="noopener noreferrer">PANRB</a> <a href="/portfolio" rel="noopener noreferrer">portofolio</a> <a href="mailto:humas&#64;menpan.go.id" rel="noopener noreferrer">surel</a></p>'
            .'<img src="'.self::MEDIA.'" alt="Foto kegiatan" />',
            $this->clean($html),
        );
    }

    /**
     * Korpus serangan XSS umum (OWASP cheat sheet). Tidak boleh ada yang bisa menjalankan skrip.
     *
     * @return array<string, array{string}>
     */
    public static function attacks(): array
    {
        return [
            'tag script' => ['<p>ok</p><script>alert(1)</script>'],
            'script huruf campur' => ['<ScRiPt>alert(1)</sCrIpT><p>ok</p>'],
            'onerror di img' => ['<img src=x onerror=alert(1)><p>ok</p>'],
            'onclick di paragraf' => ['<p onclick="alert(1)">ok</p>'],
            'onmouseover di tautan' => ['<p><a href="/a" onmouseover="alert(1)">ok</a></p>'],
            'javascript: di href' => ['<p><a href="javascript:alert(1)">ok</a></p>'],
            'javascript: tersamar entitas' => ['<p><a href="jav&#x09;ascript:alert(1)">ok</a></p>'],
            'javascript: huruf besar dan spasi' => ['<p><a href=" JaVaScRiPt:alert(1)">ok</a></p>'],
            'data: di href' => ['<p><a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">ok</a></p>'],
            'vbscript:' => ['<p><a href="vbscript:msgbox(1)">ok</a></p>'],
            'iframe' => ['<iframe src="https://example.com"></iframe><p>ok</p>'],
            'iframe srcdoc' => ['<iframe srcdoc="<script>alert(1)</script>"></iframe><p>ok</p>'],
            'svg onload' => ['<svg onload=alert(1)><p>ok</p></svg>'],
            'svg berisi script' => ['<svg><script>alert(1)</script></svg><p>ok</p>'],
            'object/embed' => ['<object data="javascript:alert(1)"></object><embed src="x.swf"><p>ok</p>'],
            'style tag' => ['<style>body{background:url(javascript:alert(1))}</style><p>ok</p>'],
            'atribut style' => ['<p style="background:url(javascript:alert(1))">ok</p>'],
            'form dan tombol' => ['<form action="https://example.com"><button formaction="javascript:alert(1)">ok</button></form>'],
            'meta refresh' => ['<meta http-equiv="refresh" content="0;url=javascript:alert(1)"><p>ok</p>'],
            'base href' => ['<base href="https://example.com/"><p>ok</p>'],
            'math' => ['<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>'],
            'mutasi komentar' => ['<!--<img src="--><img src=x onerror=alert(1)//">'],
            'noscript' => ['<noscript><p title="</noscript><img src=x onerror=alert(1)>">'],
            'template' => ['<template><script>alert(1)</script></template><p>ok</p>'],
            'details ontoggle' => ['<details open ontoggle=alert(1)><p>ok</p></details>'],
        ];
    }

    #[DataProvider('attacks')]
    public function test_strips_script_execution_vectors(string $attack): void
    {
        $result = strtolower($this->clean($attack));

        foreach (['<script', 'javascript:', 'vbscript:', 'data:', 'onerror', 'onload', 'onclick', 'onmouseover', 'ontoggle', '<iframe', '<svg', '<object', '<embed', '<style', 'style=', '<form', '<meta', '<base', 'srcdoc'] as $needle) {
            $this->assertStringNotContainsString($needle, $result, "lolos: {$needle}");
        }
    }

    public function test_images_only_from_own_uploads(): void
    {
        $this->assertSame('<img alt="pelacak" />', $this->clean('<img src="https://pelacak.example/p.gif" alt="pelacak">'));
        $this->assertSame('<img alt="x" />', $this->clean('<img src="data:image/png;base64,iVBORw0KGgo=" alt="x">'));
        $this->assertSame('<img alt="x" />', $this->clean('<img src="/storage/media/../../.env" alt="x">'));
        $this->assertSame('<img alt="x" />', $this->clean('<img src="//pelacak.example/p.gif" alt="x">'));
    }

    /** @return array<string, array{string}> */
    public static function protocolRelativeLinks(): array
    {
        return [
            'dua garis miring' => ['//situs-lain.example'],
            'garis miring dan backslash' => ['/\\situs-lain.example'],
            'dua backslash' => ['\\\\situs-lain.example'],
        ];
    }

    #[DataProvider('protocolRelativeLinks')]
    public function test_rejects_links_that_browsers_treat_as_another_site(string $href): void
    {
        $this->assertSame('<p><a rel="noopener noreferrer">tautan</a></p>', $this->clean('<p><a href="'.$href.'">tautan</a></p>'));
    }

    public function test_unknown_formatting_from_pasted_documents_keeps_its_text(): void
    {
        $this->assertSame(
            'Judul besar<p>Isi penting</p>',
            $this->clean('<h1 class="x">Judul besar</h1><div style="color:red"><p>Isi <span style="font-weight:bold">penting</span></p></div>'),
        );
        $this->assertSame('<p>teks Word</p>', $this->clean('<p><span class="MsoNormal">teks Word</span></p>'));
    }

    public function test_unknown_elements_and_head_elements_are_dropped_with_their_content(): void
    {
        $this->assertSame('<p>ok</p>', $this->clean('<style>a{}</style><title>t</title><p>ok</p><custom-tag>x</custom-tag>'));
    }

    public function test_text_is_escaped_not_interpreted(): void
    {
        $this->assertSame('<p>5 &lt; 6 &amp; &#34;kutip&#34;</p>', $this->clean('<p>5 &lt; 6 &amp; "kutip"</p>'));
    }

    /** @return array<string, array{string, bool}> */
    public static function contentCases(): array
    {
        return [
            'paragraf kosong (editor kosong)' => ['<p></p>', false],
            'hanya spasi dan nbsp' => ['<p> &nbsp; </p><p>&#160;</p>', false],
            'hanya baris baru' => ['<p><br /></p>', false],
            'teks' => ['<p>Halo</p>', true],
            'hanya gambar' => ['<img src="'.self::MEDIA.'" alt="Foto" />', true],
        ];
    }

    #[DataProvider('contentCases')]
    public function test_detects_whether_there_is_meaningful_content(string $html, bool $expected): void
    {
        $this->assertSame($expected, ArticleHtmlSanitizer::hasContent($html));
    }
}
