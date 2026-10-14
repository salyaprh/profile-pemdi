<?php

namespace App\Http\Requests;

use Closure;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Validation\Validator;

/**
 * Formulir "Hubungi kami". Aturannya sama dengan frontend/src/lib/validators.ts dan diuji dengan
 * kasus yang sama (frontend/src/lib/contact-validation-cases.json), termasuk pesan galatnya.
 */
class ContactMessageRequest extends FormRequest
{
    /** Kolom jebakan bot; harus sama dengan HONEYPOT_FIELD di frontend/src/services/contact.ts. */
    public const HONEYPOT_FIELD = 'kolom_khusus';

    private const EMAIL_PATTERN = '/^[^\s@]+@[^\s@]+\.[^\s@]+$/';

    public function authorize(): bool
    {
        return true;
    }

    /**
     * Nomor ponsel dibersihkan seperti di frontend: spasi, tanda hubung, dan kurung dibuang. Nilai
     * yang hanya berisi kode negara (paling banyak 3 angka, mis. "+62") berarti tidak diisi.
     */
    protected function prepareForValidation(): void
    {
        $phone = $this->input('phone');
        if (! is_string($phone)) {
            return; // bukan teks (mis. array): dibiarkan agar ditolak aturan `string` di bawah
        }

        $phone = preg_replace('/[\s\-()]/', '', $phone);
        $this->merge(['phone' => preg_match('/^\+?\d{0,3}$/', (string) $phone) ? null : $phone]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['bail', 'required', 'string', 'min:3', 'max:100'],
            'email' => ['bail', 'required', 'string', 'max:254', 'regex:'.self::EMAIL_PATTERN],
            'phone' => ['bail', 'nullable', 'string', 'regex:/^\+?\d{10,15}$/'],
            'subject' => ['bail', 'required', 'string', 'max:150'],
            'message' => ['bail', 'required', 'string', 'min:10', 'max:1000'],
            'token' => ['bail', 'required', 'string'],
            self::HONEYPOT_FIELD => ['bail', 'nullable', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama lengkap wajib diisi',
            'name.min' => 'Minimal 3 karakter',
            'name.max' => 'Maksimal 100 karakter',
            'email.required' => 'Email wajib diisi',
            'email.max' => 'Format email tidak valid',
            'email.regex' => 'Format email tidak valid',
            'phone.regex' => 'Nomor ponsel harus 10-15 digit angka',
            'subject.required' => 'Subjek wajib diisi',
            'subject.max' => 'Subjek maksimal 150 karakter',
            'message.required' => 'Pesan wajib diisi',
            'message.min' => 'Pesan minimal 10 karakter',
            'message.max' => 'Pesan maksimal 1000 karakter',
            'token.required' => 'Formulir kedaluwarsa. Kirim ulang pesan Anda.',
        ];
    }

    /**
     * Token formulir berisi waktu formulir dibuka, terenkripsi APP_KEY (GET /api/contact/token).
     *
     * @return array<int, Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->has('token')) {
                    return;
                }
                try {
                    $openedAt = (int) Crypt::decryptString((string) $this->input('token'));
                } catch (DecryptException) {
                    $openedAt = 0;
                }
                $ttl = (int) config('pemdi.contact.token_ttl_minutes') * 60;
                if ($openedAt <= 0 || $openedAt > now()->getTimestamp() || now()->getTimestamp() - $openedAt > $ttl) {
                    $validator->errors()->add('token', 'Formulir kedaluwarsa. Kirim ulang pesan Anda.');

                    return;
                }
                // Terlalu cepat dijawab 422 (bukan dibuang diam-diam): pengunjung sungguhan yang memakai
                // isi-otomatis browser bisa mengirim dalam hitungan detik, dan pesannya tidak boleh hilang
                // tanpa kabar. Frontend mengambil token baru; kirim ulang beberapa detik kemudian berhasil.
                if (now()->getTimestamp() - $openedAt < (int) config('pemdi.contact.min_seconds')) {
                    $validator->errors()->add('token', 'Formulir dikirim terlalu cepat. Tunggu beberapa detik lalu kirim ulang.');
                }
            },
        ];
    }

    /** Kolom jebakan terisi: hanya bot yang mengisi kolom yang tersembunyi dari pengguna. */
    public function looksAutomated(): bool
    {
        return $this->filled(self::HONEYPOT_FIELD);
    }

    /**
     * @return array{name: string, email: string, phone: ?string, subject: string, message: string}
     */
    public function messageData(): array
    {
        return [
            'name' => $this->string('name')->value(),
            'email' => $this->string('email')->value(),
            'phone' => $this->input('phone'),
            'subject' => $this->string('subject')->value(),
            'message' => $this->string('message')->value(),
        ];
    }
}
