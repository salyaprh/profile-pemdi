<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContactMessageResource;
use App\Models\ActivityLog;
use App\Models\ContactMessage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/**
 * Kotak masuk pesan "Hubungi kami" (khusus Admin; middleware can:admin di routes/api.php).
 * Membaca pesan tidak dicatat di log aktivitas; menghapus dicatat tanpa data pengirim.
 */
class ContactMessageController extends Controller
{
    private const PER_PAGE = 20;

    /** Filter: ?status=belum-dibaca, ?page=<n>. */
    public function index(Request $request): AnonymousResourceCollection
    {
        $messages = ContactMessage::query()
            ->when($request->string('status')->value() === 'belum-dibaca', fn ($query) => $query->whereNull('read_at'))
            ->latest('created_at')
            ->latest('id')
            ->paginate(self::PER_PAGE)
            ->withQueryString();

        return ContactMessageResource::collection($messages);
    }

    public function show(ContactMessage $message): ContactMessageResource
    {
        return (new ContactMessageResource($message))->detail();
    }

    /** PATCH { read: boolean }: tandai sudah/belum dibaca. */
    public function update(Request $request, ContactMessage $message): ContactMessageResource
    {
        $read = $request->validate(['read' => ['required', 'boolean']])['read'];
        $message->read_at = $read ? ($message->read_at ?? now()) : null;
        $message->save();

        return (new ContactMessageResource($message))->detail();
    }

    public function destroy(ContactMessage $message): Response
    {
        // Data pengirim tidak ikut dicatat: log aktivitas tidak terenkripsi dan tidak ikut terhapus.
        ActivityLog::record('pesan_dihapus', "Menghapus pesan masuk #{$message->id}.");
        $message->delete();

        return response()->noContent();
    }
}
