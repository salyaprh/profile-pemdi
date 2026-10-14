<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Category;
use App\Models\ContactMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Route as LaravelRoute;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Input sampah (tipe salah, array di tempat string, null, sangat panjang) ke SETIAP endpoint yang
 * mengubah data tidak boleh menghasilkan galat server (5xx): harus ditolak 4xx.
 */
class MalformedInputTest extends TestCase
{
    use RefreshDatabase;

    /** @return list<array<string, mixed>> */
    private function garbagePayloads(): array
    {
        $fields = ['name', 'email', 'role', 'is_active', 'password', 'password_confirmation', 'current_password', 'title', 'slug',
            'excerpt', 'body_html', 'category_id', 'cover_url', 'source', 'updated_at', 'note', 'read', 'description', 'hero_stats',
            'contact', 'social', 'file', 'token', 'subject', 'message', 'phone', 'kolom_khusus'];

        return [
            [],
            array_fill_keys($fields, ['a' => [1, 2]]),
            array_fill_keys($fields, null),
            array_fill_keys($fields, true),
            array_fill_keys($fields, 12345),
            array_fill_keys($fields, str_repeat('é', 20000)),
            array_fill_keys($fields, "\0\x1f<script>alert(1)</script>'\" OR 1=1--"),
            ['hero_stats' => 'x', 'contact' => 'x', 'social' => 'x'],
            ['hero_stats' => [['value' => ['x']], 'bukan array', null], 'contact' => ['email' => ['x']], 'social' => ['x' => ['y']]],
        ];
    }

    /** @return list<LaravelRoute> */
    private function mutatingRoutes(): array
    {
        return array_values(array_filter(
            Route::getRoutes()->getRoutes(),
            fn (LaravelRoute $route): bool => (str_starts_with($route->uri(), 'api/admin') || in_array($route->uri(), ['api/contact', 'api/auth/password', 'api/auth/login'], true))
                && array_diff($route->methods(), ['GET', 'HEAD']) !== [],
        ));
    }

    public function test_garbage_input_never_causes_a_server_error(): void
    {
        $admin = User::factory()->admin()->create();
        $ids = [
            'article' => Article::factory()->create()->id,
            'category' => Category::factory()->create()->id,
            'message' => ContactMessage::factory()->create()->id,
            'user' => User::factory()->create()->id,
        ];
        config(['pemdi.contact.rate_limit' => 100000, 'pemdi.public_rate_limit' => 100000]);

        $this->actingAs($admin);
        $checked = 0;
        foreach ($this->mutatingRoutes() as $route) {
            // Id yang benar-benar ada, agar validasi (bukan 404 model) yang diuji.
            $uri = '/'.preg_replace_callback('/\{([^}]+)\}/', fn (array $m): string => (string) $ids[$m[1]], $route->uri());
            foreach (array_diff($route->methods(), ['GET', 'HEAD']) as $method) {
                foreach ($this->garbagePayloads() as $index => $payload) {
                    // Throttle per-rute (mis. 6/menit) memberi 429, yang juga bukan galat server.
                    $status = $this->json($method, $uri, $payload)->getStatusCode();
                    $this->assertLessThan(500, $status, "{$method} {$route->uri()} payload #{$index} menghasilkan {$status}");
                    $checked++;
                }
            }
        }
        $this->assertGreaterThan(100, $checked);
    }

    public function test_the_same_holds_for_a_penulis_and_for_guests(): void
    {
        $penulis = User::factory()->create();
        Article::factory()->create(['author_id' => $penulis->id]);
        config(['pemdi.contact.rate_limit' => 100000]);

        foreach ([null, $penulis] as $actor) {
            if ($actor !== null) {
                $this->actingAs($actor);
            }
            foreach ($this->mutatingRoutes() as $route) {
                $uri = '/'.preg_replace('/\{[^}]+\}/', '1', $route->uri());
                foreach (array_diff($route->methods(), ['GET', 'HEAD']) as $method) {
                    foreach ($this->garbagePayloads() as $index => $payload) {
                        $status = $this->json($method, $uri, $payload)->getStatusCode();
                        $this->assertLessThan(500, $status, "{$method} {$route->uri()} payload #{$index} menghasilkan {$status}");
                    }
                }
            }
        }
    }

    public function test_absurd_ids_in_the_url_are_a_404_not_a_server_error(): void
    {
        $this->actingAs(User::factory()->admin()->create());

        foreach ($this->adminRoutes() as $route) {
            if (! str_contains($route->uri(), '{')) {
                continue;
            }
            $uri = '/'.preg_replace('/\{[^}]+\}/', '99999999999999999999999', $route->uri());
            foreach (array_diff($route->methods(), ['HEAD']) as $method) {
                $status = $this->json($method, $uri)->getStatusCode();
                $this->assertLessThan(500, $status, "{$method} {$route->uri()} dengan id raksasa menghasilkan {$status}");
            }
        }
    }

    /** @return list<LaravelRoute> */
    private function adminRoutes(): array
    {
        return array_values(array_filter(
            Route::getRoutes()->getRoutes(),
            fn (LaravelRoute $route): bool => str_starts_with($route->uri(), 'api/admin'),
        ));
    }
}
