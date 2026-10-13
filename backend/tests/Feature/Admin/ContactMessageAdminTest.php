<?php

namespace Tests\Feature\Admin;

use App\Models\ActivityLog;
use App\Models\ContactMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Kotak masuk pesan "Hubungi kami" di panel admin (khusus Admin). */
class ContactMessageAdminTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->admin()->create();
    }

    public function test_guests_and_penulis_cannot_read_messages(): void
    {
        $message = ContactMessage::factory()->create();
        $penulis = User::factory()->create();

        $this->getJson('/api/admin/messages')->assertUnauthorized();
        $this->actingAs($penulis)->getJson('/api/admin/messages')->assertForbidden();
        $this->actingAs($penulis)->getJson("/api/admin/messages/{$message->id}")->assertForbidden();
        $this->actingAs($penulis)->patchJson("/api/admin/messages/{$message->id}", ['read' => true])->assertForbidden();
        $this->actingAs($penulis)->deleteJson("/api/admin/messages/{$message->id}")->assertForbidden();
        $this->assertModelExists($message);
    }

    public function test_admin_lists_newest_first_with_preview_and_unread_filter(): void
    {
        $older = ContactMessage::factory()->read()->create([
            'subject' => 'Pertanyaan data',
            'created_at' => now()->subDay(),
        ]);
        $newer = ContactMessage::factory()->create([
            'name' => 'Budi Santoso',
            'email' => 'budi@instansi.go.id',
            'phone' => '+6281234567890',
            'subject' => 'Kolaborasi program',
            'message' => "Halo,\n\nkami ingin   berdiskusi. ".str_repeat('Panjang ', 40),
        ]);

        $response = $this->actingAs($this->admin())->getJson('/api/admin/messages')->assertOk();

        $this->assertSame([$newer->id, $older->id], array_column($response->json('data'), 'id'));
        $first = $response->json('data.0');
        $this->assertSame('Budi Santoso', $first['name']);
        $this->assertSame('budi@instansi.go.id', $first['email']);
        $this->assertStringStartsWith('Halo, kami ingin berdiskusi.', $first['preview']);
        $this->assertLessThanOrEqual(143, mb_strlen($first['preview']));
        $this->assertNull($first['read_at']);
        $this->assertArrayNotHasKey('message', $first);
        $this->assertArrayNotHasKey('phone', $first);
        $this->assertStringContainsString('no-store', (string) $response->headers->get('Cache-Control'));

        $this->getJson('/api/admin/messages?status=belum-dibaca')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $newer->id);
    }

    public function test_admin_reads_marks_and_unmarks_a_message(): void
    {
        $message = ContactMessage::factory()->create(['phone' => '+6281234567890', 'message' => 'Isi lengkap pesan.']);

        $this->actingAs($this->admin())->getJson("/api/admin/messages/{$message->id}")
            ->assertOk()
            ->assertJsonPath('data.phone', '+6281234567890')
            ->assertJsonPath('data.message', 'Isi lengkap pesan.')
            ->assertJsonPath('data.read_at', null);
        // Membuka detail tidak menandai dibaca; frontend mengirim PATCH secara eksplisit.
        $this->assertFalse($message->refresh()->isRead());

        $this->patchJson("/api/admin/messages/{$message->id}", ['read' => true])->assertOk();
        $this->assertTrue($message->refresh()->isRead());
        $firstReadAt = $message->read_at?->toIso8601String();

        // Menandai dibaca lagi tidak mengubah waktu baca pertama.
        $this->travel(5)->minutes();
        $this->patchJson("/api/admin/messages/{$message->id}", ['read' => true])->assertOk();
        $this->assertSame($firstReadAt, $message->refresh()->read_at?->toIso8601String());

        $this->patchJson("/api/admin/messages/{$message->id}", ['read' => false])
            ->assertOk()
            ->assertJsonPath('data.read_at', null);
        $this->patchJson("/api/admin/messages/{$message->id}", ['read' => 'ya'])->assertUnprocessable();
    }

    public function test_admin_deletes_a_message_and_the_log_omits_sender_data(): void
    {
        $message = ContactMessage::factory()->create(['name' => 'Budi Santoso', 'subject' => 'Rahasia']);

        $this->actingAs($this->admin())->deleteJson("/api/admin/messages/{$message->id}")->assertNoContent();

        $this->assertModelMissing($message);
        $log = ActivityLog::where('action', 'pesan_dihapus')->sole();
        $this->assertSame("Menghapus pesan masuk #{$message->id}.", $log->description);
        $this->getJson("/api/admin/messages/{$message->id}")->assertNotFound();
    }

    public function test_dashboard_shows_unread_count_to_admin_only(): void
    {
        ContactMessage::factory()->count(2)->create();
        ContactMessage::factory()->read()->create();

        $this->actingAs($this->admin())->getJson('/api/admin/dashboard')->assertJsonPath('unread_messages', 2);
        $this->actingAs(User::factory()->create())->getJson('/api/admin/dashboard')->assertJsonMissingPath('unread_messages');
    }
}
