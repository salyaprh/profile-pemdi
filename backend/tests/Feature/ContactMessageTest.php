<?php

namespace Tests\Feature;

use App\Models\ContactMessage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/** Formulir "Hubungi kami" publik: penyimpanan terenkripsi dan perlindungan spam. */
class ContactMessageTest extends TestCase
{
    use RefreshDatabase;

    /** Token formulir yang dibuka sekian detik lalu (seperti dari GET /api/contact/token). */
    private function tokenOpenedSecondsAgo(int $seconds): string
    {
        return Crypt::encryptString((string) (now()->getTimestamp() - $seconds));
    }

    /**
     * @param  array<string, string|null>  $overrides
     * @return array<string, string|null>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Budi Santoso',
            'email' => 'budi@instansi.go.id',
            'phone' => '+62 812-3456-7890',
            'subject' => 'Kolaborasi program',
            'message' => 'Halo, kami ingin berdiskusi terkait kolaborasi program.',
            'token' => $this->tokenOpenedSecondsAgo(30),
            'kolom_khusus' => '',
        ], $overrides);
    }

    public function test_token_endpoint_returns_an_encrypted_timestamp_without_cookies(): void
    {
        $response = $this->getJson('/api/contact/token')->assertOk();

        $openedAt = (int) Crypt::decryptString($response->json('token'));
        $this->assertEqualsWithDelta(now()->getTimestamp(), $openedAt, 2);
        $this->assertStringContainsString('no-store', (string) $response->headers->get('Cache-Control'));
        $this->assertEmpty($response->headers->getCookies());
    }

    public function test_valid_message_is_stored_encrypted_without_session_or_csrf(): void
    {
        $response = $this->postJson('/api/contact', $this->payload())
            ->assertStatus(202)
            ->assertExactJson(['message' => 'Pesan diterima.']);

        $this->assertEmpty($response->headers->getCookies());
        $message = ContactMessage::sole();
        $this->assertSame('Budi Santoso', $message->name);
        $this->assertSame('+6281234567890', $message->phone, 'nomor ponsel disimpan tanpa spasi/tanda hubung');
        $this->assertNull($message->read_at);

        // Di database, tidak ada data pribadi yang tersimpan sebagai teks biasa.
        $raw = (array) DB::table('contact_messages')->first();
        foreach (['name', 'email', 'phone', 'subject', 'message'] as $column) {
            $this->assertNotSame($message->{$column}, $raw[$column], "kolom {$column} terenkripsi");
            $this->assertStringNotContainsString('Budi', (string) $raw[$column]);
        }
    }

    public function test_phone_with_only_a_country_code_counts_as_empty(): void
    {
        $this->postJson('/api/contact', $this->payload(['phone' => '+62']))->assertStatus(202);

        $this->assertNull(ContactMessage::sole()->phone);
    }

    public function test_validation_errors_use_the_same_messages_as_the_frontend(): void
    {
        $this->postJson('/api/contact', $this->payload([
            'name' => 'Bu',
            'email' => 'budi@instansi',
            'phone' => '0812',
            'subject' => '',
            'message' => 'pendek',
        ]))
            ->assertUnprocessable()
            ->assertJsonPath('errors.name.0', 'Minimal 3 karakter')
            ->assertJsonPath('errors.email.0', 'Format email tidak valid')
            ->assertJsonPath('errors.phone.0', 'Nomor ponsel harus 10-15 digit angka')
            ->assertJsonPath('errors.subject.0', 'Subjek wajib diisi')
            ->assertJsonPath('errors.message.0', 'Pesan minimal 10 karakter');

        $this->assertSame(0, ContactMessage::count());
    }

    public function test_missing_forged_or_expired_tokens_are_rejected(): void
    {
        foreach ([
            null,
            'bukan-token',
            base64_encode((string) now()->getTimestamp()),
            $this->tokenOpenedSecondsAgo(121 * 60),
            Crypt::encryptString((string) (now()->getTimestamp() + 600)), // dari masa depan
        ] as $token) {
            $this->postJson('/api/contact', $this->payload(['token' => $token]))
                ->assertUnprocessable()
                ->assertJsonPath('errors.token.0', 'Formulir kedaluwarsa. Kirim ulang pesan Anda.');
        }

        $this->assertSame(0, ContactMessage::count());
    }

    public function test_honeypot_and_too_fast_submissions_look_accepted_but_are_not_stored(): void
    {
        $this->postJson('/api/contact', $this->payload(['kolom_khusus' => 'https://spam.example']))
            ->assertStatus(202)
            ->assertExactJson(['message' => 'Pesan diterima.']);
        $this->postJson('/api/contact', $this->payload(['token' => $this->tokenOpenedSecondsAgo(1)]))
            ->assertStatus(202);

        $this->assertSame(0, ContactMessage::count());

        $this->postJson('/api/contact', $this->payload(['token' => $this->tokenOpenedSecondsAgo(3)]))
            ->assertStatus(202);
        $this->assertSame(1, ContactMessage::count());
    }

    public function test_messages_are_rate_limited_per_ip(): void
    {
        config(['pemdi.contact.rate_limit' => 2]);

        $this->postJson('/api/contact', $this->payload())->assertStatus(202);
        $this->postJson('/api/contact', $this->payload())->assertStatus(202);
        $this->postJson('/api/contact', $this->payload())
            ->assertStatus(429)
            ->assertJsonPath('message', 'Terlalu banyak pesan dari jaringan Anda. Coba lagi beberapa menit lagi.');

        $this->assertSame(2, ContactMessage::count());
    }

    public function test_messages_older_than_the_retention_period_are_pruned(): void
    {
        $old = ContactMessage::factory()->create(['created_at' => now()->subMonths(12)->subDay()]);
        $recent = ContactMessage::factory()->create(['created_at' => now()->subMonths(11)]);

        $this->artisan('model:prune', ['--model' => [ContactMessage::class]])->assertSuccessful();

        $this->assertModelMissing($old);
        $this->assertModelExists($recent);
    }
}
