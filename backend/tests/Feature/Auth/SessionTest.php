<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_me_returns_null_for_guests_without_an_error_status(): void
    {
        $this->getJson('/api/auth/me')->assertOk()->assertExactJson(['user' => null]);
    }

    public function test_me_returns_the_logged_in_user(): void
    {
        $user = User::factory()->admin()->create();

        $this->actingAs($user)->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('user.role', 'admin')
            ->assertJsonPath('user.role_label', 'Admin')
            ->assertJsonMissingPath('user.password');
    }

    public function test_me_ends_the_session_of_a_deactivated_user(): void
    {
        $user = User::factory()->inactive()->create();

        $this->actingAs($user)->getJson('/api/auth/me')->assertOk()->assertExactJson(['user' => null]);

        $this->assertGuest();
    }

    public function test_csrf_endpoint_sets_the_xsrf_cookie(): void
    {
        $this->get('/api/csrf')->assertNoContent()->assertCookie('XSRF-TOKEN');
    }

    public function test_logout_ends_the_session_and_is_logged(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/auth/logout')->assertNoContent();

        $this->assertGuest();
        $this->assertDatabaseHas('activity_logs', ['action' => 'logout', 'user_id' => $user->id]);
    }

    public function test_logout_requires_a_session(): void
    {
        $this->postJson('/api/auth/logout')->assertUnauthorized();
    }

    public function test_session_cookie_is_http_only(): void
    {
        $this->assertTrue(config('session.http_only'));
        $this->assertSame('lax', config('session.same_site'));
    }
}
