<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\Crypt;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Aturan formulir kontak di server sama dengan di browser: kasus diambil dari berkas yang juga
 * dipakai frontend/src/lib/validators.test.ts.
 */
class ContactValidationParityTest extends TestCase
{
    use RefreshDatabase;

    private const CASES_FILE = __DIR__.'/../../../frontend/src/lib/contact-validation-cases.json';

    /** @return iterable<string, array{string, string, bool}> */
    public static function cases(): iterable
    {
        /** @var array<string, mixed> $all */
        $all = json_decode((string) file_get_contents(self::CASES_FILE), true, flags: JSON_THROW_ON_ERROR);

        foreach (['name', 'email', 'phone', 'subject', 'message'] as $field) {
            /** @var list<array{value: string|array{ulang: string, kali: int}, valid: bool}> $fieldCases */
            $fieldCases = $all[$field];
            foreach ($fieldCases as $index => $case) {
                $value = is_array($case['value'])
                    ? str_repeat($case['value']['ulang'], $case['value']['kali'])
                    : $case['value'];
                yield "{$field} #{$index}" => [$field, $value, $case['valid']];
            }
        }
    }

    #[DataProvider('cases')]
    public function test_field_rule_matches_the_frontend(string $field, string $value, bool $valid): void
    {
        $payload = array_merge([
            'name' => 'Budi Santoso',
            'email' => 'budi@instansi.go.id',
            'phone' => '',
            'subject' => 'Kolaborasi program',
            'message' => 'Halo, ini pesan uji yang cukup panjang.',
            'token' => Crypt::encryptString((string) (now()->getTimestamp() - 60)),
        ], [$field => $value]);

        $response = $this->withoutMiddleware(ThrottleRequests::class)->postJson('/api/contact', $payload);

        if ($valid) {
            $response->assertStatus(202);
        } else {
            $response->assertUnprocessable()->assertJsonValidationErrors([$field]);
        }
    }
}
