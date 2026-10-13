<?php

namespace Tests\Feature\Admin;

use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class MediaUploadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    /** @return TestResponse<JsonResponse> */
    private function upload(UploadedFile $file): TestResponse
    {
        return $this->actingAs(User::factory()->create())->postJson('/api/admin/media', ['file' => $file]);
    }

    public function test_image_is_reencoded_to_webp_with_a_random_name_and_an_og_variant(): void
    {
        $response = $this->upload(UploadedFile::fake()->image('Foto Kegiatan.jpg', 2400, 1600))->assertCreated();

        $url = $response->json('data.url');
        $this->assertMatchesRegularExpression('#^/storage/media/[a-f0-9-]{36}\.webp$#', $url);
        $this->assertSame(str_replace('.webp', '-og.webp', $url), $response->json('data.og_url'));
        $response->assertJsonPath('data.width', 1600)->assertJsonPath('data.height', 1067);

        $stored = Storage::disk('public')->get(substr($url, strlen('/storage/')));
        $this->assertSame('RIFF', substr((string) $stored, 0, 4));
        $this->assertSame('WEBP', substr((string) $stored, 8, 4));

        [$ogWidth, $ogHeight] = getimagesizefromstring((string) Storage::disk('public')->get(substr($response->json('data.og_url'), strlen('/storage/'))));
        $this->assertSame([1200, 630], [$ogWidth, $ogHeight]);

        $this->assertDatabaseHas('media', ['original_name' => 'Foto Kegiatan.jpg', 'width' => 1600]);
        $this->assertDatabaseHas('activity_logs', ['action' => 'media_diunggah']);
    }

    public function test_small_images_are_not_upscaled(): void
    {
        $this->upload(UploadedFile::fake()->image('kecil.png', 640, 480))
            ->assertCreated()
            ->assertJsonPath('data.width', 640)
            ->assertJsonPath('data.height', 480);
    }

    public function test_code_hidden_inside_a_valid_image_does_not_survive(): void
    {
        // Gambar JPEG asli yang diberi "ekor" kode PHP/HTML (berkas polyglot).
        $jpeg = UploadedFile::fake()->image('asli.jpg', 400, 400);
        $polyglot = UploadedFile::fake()->createWithContent(
            'polyglot.jpg',
            (string) file_get_contents($jpeg->getRealPath()).'<?php system($_GET["c"]); ?><script>alert(1)</script>',
        );

        $url = $this->upload($polyglot)->assertCreated()->json('data.url');

        $stored = (string) Storage::disk('public')->get(substr($url, strlen('/storage/')));
        $this->assertStringNotContainsString('<?php', $stored);
        $this->assertStringNotContainsString('<script', $stored);
    }

    /** @return array<string, array{\Closure(): UploadedFile, string}> */
    public static function rejectedFiles(): array
    {
        return [
            'SVG (bisa berisi skrip)' => [
                fn () => UploadedFile::fake()->createWithContent('logo.svg', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
                'Berkas harus berupa gambar JPG, PNG, atau WebP.',
            ],
            // Berkas uji palsu Laravel menebak MIME dari ekstensi, jadi di sini yang menolak adalah
            // pemeriksaan dimensi (getimagesize). Di server sungguhan MIME dibaca dari isi berkas.
            'kode PHP berekstensi .jpg' => [
                fn () => UploadedFile::fake()->createWithContent('shell.jpg', '<?php system($_GET["c"]); ?>'),
                'Ukuran gambar minimal 200×200 piksel dan maksimal 8000×8000 piksel.',
            ],
            'GIF' => [
                fn () => UploadedFile::fake()->image('animasi.gif', 400, 400),
                'Berkas harus berupa gambar JPG, PNG, atau WebP.',
            ],
            'lebih dari 5 MB' => [
                fn () => UploadedFile::fake()->image('besar.jpg', 400, 400)->size(6000),
                'Ukuran gambar maksimal 5 MB.',
            ],
            'terlalu kecil' => [
                fn () => UploadedFile::fake()->image('ikon.png', 100, 100),
                'Ukuran gambar minimal 200×200 piksel dan maksimal 8000×8000 piksel.',
            ],
        ];
    }

    /** @param \Closure(): UploadedFile $file */
    #[DataProvider('rejectedFiles')]
    public function test_rejects_unsafe_or_unsuitable_files(\Closure $file, string $message): void
    {
        $this->upload($file())->assertUnprocessable()->assertJsonPath('errors.file.0', $message);

        $this->assertSame(0, Media::count());
        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    public function test_guests_cannot_upload(): void
    {
        $this->postJson('/api/admin/media', ['file' => UploadedFile::fake()->image('a.jpg', 400, 400)])->assertUnauthorized();
    }
}
