<?php

namespace Tests\Feature;

use App\Enums\ArticleStatus;
use App\Models\Article;
use App\Models\Category;
use App\Models\User;
use Database\Seeders\DemoUserSeeder;
use Database\Seeders\PlaceholderContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use RuntimeException;
use Tests\TestCase;

class SeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_placeholder_content_matches_the_former_frontend_data(): void
    {
        $this->seed(PlaceholderContentSeeder::class);

        $this->assertSame(['Kebijakan & Regulasi', 'Layanan Publik', 'Panduan Pengguna'], Category::orderBy('name')->pluck('name')->all());
        $this->assertSame(36, Article::published()->count());
        $this->assertSame(36, Article::distinct()->count('slug'));

        $first = Article::where('slug', 'pemerintah-perkuat-layanan-digital-asn-melalui-integrasi-inagov')->sole();
        $this->assertSame(ArticleStatus::Terbit, $first->status);
        $this->assertSame('2025-01-24 02:00:00', $first->published_at?->utc()->toDateTimeString(), '09.00 WIB');
        $this->assertSame('/images/articles/article-1.webp', $first->cover_url);
        $this->assertStringStartsWith('<p>Jakarta — Pemerintah', $first->body_html);
    }

    public function test_placeholder_author_cannot_log_in(): void
    {
        $this->seed(PlaceholderContentSeeder::class);

        $author = Article::firstOrFail()->author;
        $this->assertFalse($author->is_active);
        $this->assertStringEndsWith('@placeholder.invalid', $author->email);
    }

    public function test_placeholder_seeder_can_run_twice_without_duplicates(): void
    {
        $this->seed(PlaceholderContentSeeder::class);
        $this->seed(PlaceholderContentSeeder::class);

        $this->assertSame(36, Article::count());
        $this->assertSame(3, Category::count());
        $this->assertSame(1, User::count());
    }

    public function test_demo_users_use_the_configured_password(): void
    {
        config(['pemdi.demo_user_password' => 'PasswordUjiE2e123']);

        $this->seed(DemoUserSeeder::class);

        $admin = User::where('email', DemoUserSeeder::ADMIN_EMAIL)->sole();
        $this->assertTrue($admin->isAdmin());
        $this->assertTrue(Hash::check('PasswordUjiE2e123', $admin->password));
        $this->assertFalse(User::where('email', DemoUserSeeder::PENULIS_EMAIL)->sole()->isAdmin());
    }

    public function test_empty_demo_password_falls_back_to_the_default_instead_of_an_empty_password(): void
    {
        config(['pemdi.demo_user_password' => '']);

        $this->seed(DemoUserSeeder::class);

        $admin = User::where('email', DemoUserSeeder::ADMIN_EMAIL)->sole();
        $this->assertTrue(Hash::check(DemoUserSeeder::DEFAULT_PASSWORD, $admin->password));
    }

    public function test_demo_users_are_refused_in_production(): void
    {
        $this->app->detectEnvironment(fn () => 'production');

        $this->expectException(RuntimeException::class);
        // Langsung, bukan lewat db:seed (yang di produksi meminta konfirmasi interaktif).
        $this->app->make(DemoUserSeeder::class)->run();
    }
}
