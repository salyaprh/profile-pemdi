<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Route as LaravelRoute;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Inventaris keamanan semua endpoint /api/admin: setiap rute baru otomatis ikut diperiksa, sehingga
 * tidak ada endpoint admin yang lupa dijaga. Rute yang terbuka bagi Penulis harus didaftarkan
 * eksplisit di OPEN_TO_PENULIS; selebihnya wajib khusus Admin (middleware admin).
 */
class AdminRoutesSecurityTest extends TestCase
{
    use RefreshDatabase;

    /**
     * "METODE uri" yang memang dipakai Penulis; hak aksesnya diperiksa Policy di controller.
     * (Kategori: Penulis boleh membaca daftarnya, hanya Admin yang boleh mengubahnya.)
     */
    private const OPEN_TO_PENULIS = [
        'GET api/admin/dashboard',
        'GET api/admin/articles',
        'POST api/admin/articles',
        'GET api/admin/articles/{article}',
        'PUT api/admin/articles/{article}',
        'DELETE api/admin/articles/{article}',
        'POST api/admin/articles/{article}/restore',
        'DELETE api/admin/articles/{article}/permanent',
        'POST api/admin/articles/{article}/submit',
        'POST api/admin/articles/{article}/withdraw',
        'POST api/admin/articles/{article}/publish',
        'POST api/admin/articles/{article}/return',
        'POST api/admin/articles/{article}/unpublish',
        'GET api/admin/categories',
        'POST api/admin/media',
    ];

    /** @return list<LaravelRoute> */
    private function adminRoutes(): array
    {
        return array_values(array_filter(
            Route::getRoutes()->getRoutes(),
            fn (LaravelRoute $route): bool => str_starts_with($route->uri(), 'api/admin'),
        ));
    }

    /** URI dengan parameter diganti 1 (cukup untuk mencapai middleware; modelnya tidak perlu ada). */
    private function concreteUri(LaravelRoute $route): string
    {
        return '/'.preg_replace('/\{[^}]+\}/', '1', $route->uri());
    }

    /** @return list<string> */
    private function httpMethods(LaravelRoute $route): array
    {
        return array_values(array_diff($route->methods(), ['HEAD']));
    }

    public function test_the_admin_route_inventory_is_not_empty(): void
    {
        $this->assertGreaterThanOrEqual(25, count($this->adminRoutes()));
    }

    public function test_every_admin_route_requires_a_session_an_active_account_and_a_changed_password(): void
    {
        foreach ($this->adminRoutes() as $route) {
            $middleware = $route->gatherMiddleware();
            foreach (['auth', 'active', 'password.changed'] as $required) {
                $this->assertContains($required, $middleware, "{$route->uri()} tidak memakai middleware {$required}");
            }
        }
    }

    public function test_guests_are_rejected_on_every_admin_route(): void
    {
        foreach ($this->adminRoutes() as $route) {
            foreach ($this->httpMethods($route) as $method) {
                $this->assertSame(
                    401,
                    $this->json($method, $this->concreteUri($route))->getStatusCode(),
                    "{$method} {$route->uri()} tidak menolak tamu",
                );
            }
        }
    }

    public function test_every_admin_endpoint_outside_the_penulis_allowlist_is_admin_only(): void
    {
        $penulis = User::factory()->create();

        foreach ($this->adminRoutes() as $route) {
            $adminOnly = in_array('admin', $route->gatherMiddleware(), true);
            foreach ($this->httpMethods($route) as $method) {
                $endpoint = "{$method} {$route->uri()}";
                if (in_array($endpoint, self::OPEN_TO_PENULIS, true)) {
                    $this->assertFalse($adminOnly, "{$endpoint} ada di OPEN_TO_PENULIS tetapi khusus Admin");

                    continue;
                }
                $this->assertTrue($adminOnly, "{$endpoint} tidak khusus Admin dan belum didaftarkan di OPEN_TO_PENULIS");
                $this->assertSame(
                    403,
                    $this->actingAs($penulis)->json($method, $this->concreteUri($route))->getStatusCode(),
                    "{$endpoint} tidak menolak Penulis",
                );
            }
        }
    }

    public function test_the_open_allowlist_only_names_endpoints_that_exist(): void
    {
        $endpoints = [];
        foreach ($this->adminRoutes() as $route) {
            foreach ($this->httpMethods($route) as $method) {
                $endpoints[] = "{$method} {$route->uri()}";
            }
        }

        $this->assertSame([], array_values(array_diff(self::OPEN_TO_PENULIS, $endpoints)));
    }

    public function test_public_routes_never_start_a_session_or_ask_for_login(): void
    {
        foreach (Route::getRoutes()->getRoutes() as $route) {
            $isPublicApi = in_array($route->uri(), [
                'api/articles', 'api/articles/{slug}', 'api/categories', 'api/site', 'api/contact', 'api/contact/token',
            ], true);
            if (! $isPublicApi) {
                continue;
            }
            $middleware = $route->gatherMiddleware();
            $this->assertNotContains('auth', $middleware, $route->uri());
            $this->assertNotContains('web', $middleware, "{$route->uri()} memakai grup web (sesi dan cookie)");
        }
    }

    public function test_penulis_cannot_tell_which_ids_exist_on_admin_only_endpoints(): void
    {
        $penulis = User::factory()->create();
        $existing = User::factory()->create();

        // Id yang ada dan yang tidak ada dijawab sama (403), bukan 403 vs 404.
        $this->actingAs($penulis)->getJson("/api/admin/users/{$existing->id}")->assertForbidden();
        $this->getJson('/api/admin/users/99999')->assertForbidden();
        $this->getJson('/api/admin/messages/99999')->assertForbidden();
    }
}
