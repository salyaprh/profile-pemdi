<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    public function test_health_endpoint_reports_application_is_up(): void
    {
        $this->get('/up')->assertOk();
    }

    public function test_backend_does_not_serve_html_pages(): void
    {
        // Halaman situs dilayani frontend; backend tidak boleh diam-diam merender halaman bawaan Laravel.
        $this->get('/')->assertNotFound();
    }
}
