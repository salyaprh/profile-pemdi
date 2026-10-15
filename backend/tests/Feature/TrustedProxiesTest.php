<?php

namespace Tests\Feature;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/** IP pengunjung di balik reverse proxy: X-Forwarded-For hanya dipercaya dari proxy yang terdaftar. */
class TrustedProxiesTest extends TestCase
{
    protected function setUp(): void
    {
        // Harus diatur sebelum aplikasi dibuat: bootstrap/app.php membaca TRUSTED_PROXIES saat boot.
        putenv('TRUSTED_PROXIES=10.0.0.1');
        $_ENV['TRUSTED_PROXIES'] = '10.0.0.1';
        parent::setUp();

        Route::get('/_ip', fn (Request $request) => $request->ip());
    }

    protected function tearDown(): void
    {
        putenv('TRUSTED_PROXIES');
        unset($_ENV['TRUSTED_PROXIES']);
        parent::tearDown();
    }

    public function test_forwarded_for_is_used_when_it_comes_from_a_trusted_proxy(): void
    {
        $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.1'])
            ->get('/_ip', ['X-Forwarded-For' => '203.0.113.9'])
            ->assertContent('203.0.113.9');
    }

    public function test_forwarded_for_is_ignored_from_anyone_else(): void
    {
        $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.4'])
            ->get('/_ip', ['X-Forwarded-For' => '203.0.113.9'])
            ->assertContent('198.51.100.4');
    }
}
