<?php

namespace App\Support;

use Symfony\Component\HtmlSanitizer\HtmlSanitizer;
use Symfony\Component\HtmlSanitizer\HtmlSanitizerConfig;
use Symfony\Component\HtmlSanitizer\Visitor\AttributeSanitizer\AttributeSanitizerInterface;

/**
 * Penyaring isi artikel dari editor WYSIWYG. Hanya elemen dan atribut yang bisa dibuat toolbar
 * editor (frontend/src/admin/editor) yang dipertahankan. Atribut lain (style, class, on*), tautan
 * javascript:/data:, dan gambar dari situs lain dibuang; elemen berbahaya dibuang beserta isinya.
 *
 * Dijalankan di server setiap kali artikel disimpan, karena isi dari browser tidak bisa dipercaya.
 * CSP ketat di frontend menjadi lapisan kedua bila ada yang lolos.
 */
final class ArticleHtmlSanitizer implements AttributeSanitizerInterface
{
    /** Batas panjang HTML (byte) yang diterima validasi; di atas ini sanitizer akan memotong. */
    public const MAX_LENGTH = 200_000;

    /**
     * Elemen pembungkus/format yang tidak dipakai editor tetapi sering ikut saat menempel dari Word
     * atau situs lain: tag-nya dibuang, teks di dalamnya dipertahankan. Elemen lain yang tidak
     * dikenal (script, style, iframe, svg, form, ...) dibuang BESERTA isinya (aksi bawaan).
     */
    private const UNWRAPPED_ELEMENTS = [
        'h1', 'h4', 'h5', 'h6', 'div', 'span', 'section', 'article', 'header', 'footer', 'main',
        'aside', 'nav', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th',
        'caption', 'b', 'i', 'small', 'big', 'sub', 'sup', 'mark', 'code', 'pre', 'kbd', 'samp',
        'abbr', 'cite', 'q', 'del', 'ins', 'dl', 'dt', 'dd', 'address', 'time', 'font', 'center', 'label',
    ];

    private HtmlSanitizer $sanitizer;

    public function __construct()
    {
        $config = (new HtmlSanitizerConfig)
            ->allowElement('p')
            ->allowElement('h2')
            ->allowElement('h3')
            ->allowElement('strong')
            ->allowElement('em')
            ->allowElement('u')
            ->allowElement('s')
            ->allowElement('ul')
            ->allowElement('ol')
            ->allowElement('li')
            ->allowElement('blockquote')
            ->allowElement('br')
            ->allowElement('hr')
            ->allowElement('a', ['href', 'title'])
            ->allowElement('img', ['src', 'alt'])
            ->allowLinkSchemes(['http', 'https', 'mailto'])
            ->allowRelativeLinks()
            ->forceAttribute('a', 'rel', 'noopener noreferrer')
            // Gambar hanya dari unggahan sendiri: tanpa skema (data:, http:) dan tanpa host luar.
            ->allowMediaSchemes([])
            ->allowRelativeMedias()
            ->withAttributeSanitizer($this)
            ->withMaxInputLength(self::MAX_LENGTH);

        foreach (self::UNWRAPPED_ELEMENTS as $element) {
            $config = $config->blockElement($element);
        }

        $this->sanitizer = new HtmlSanitizer($config);
    }

    public function sanitize(string $html): string
    {
        return trim($this->sanitizer->sanitize($html));
    }

    /** Apakah HTML (yang sudah disaring) punya isi yang bermakna: teks atau gambar. */
    public static function hasContent(string $html): bool
    {
        $text = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        // \s tidak mencakup spasi tak terputus (&nbsp;) yang sering dihasilkan editor.
        $visible = preg_replace('/[\s\x{00A0}\x{200B}]+/u', '', $text) ?? '';

        return $visible !== '' || str_contains($html, '<img');
    }

    /** @return list<string> */
    public function getSupportedElements(): array
    {
        return ['img', 'a'];
    }

    /** @return list<string> */
    public function getSupportedAttributes(): array
    {
        return ['src', 'href'];
    }

    public function sanitizeAttribute(string $element, string $attribute, string $value, HtmlSanitizerConfig $config): ?string
    {
        if ($element === 'img') {
            return MediaUrl::isUploaded($value) ? $value : null;
        }

        // Diawali dua garis miring/backslash (//situs-lain, /\situs-lain, \\situs-lain) dibaca browser
        // sebagai alamat situs lain, bukan tautan relatif: tolak.
        return preg_match('#^\s*[/\\\\]{2}#', $value) === 1 ? null : $value;
    }
}
