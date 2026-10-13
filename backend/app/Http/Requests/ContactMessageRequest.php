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

    /** Waktu formulir dibuka (dari token), diisi saat validasi. */
    private ?int $formOpenedAt = null;

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
        $phone = preg_replace('/[\s\-()]/', '', (string) $this->input('phone', ''));
        $this->merge(['phone' => preg_match('/^\+?\d{0,3}$/', (string) $phone) ? null : $phone]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:3', 'max:100'],
            'email' => ['required', 'string', 'max:254', 'regex:'.self::EMAIL_PATTERN],
            'phone' => ['nullable', 'string', 'regex:/^\+?\d{10,15}$/'],
            'subject' => ['required', 'string', 'max:150'],
            'message' => ['required', 'string', 'min:10', 'max:1000'],
            'token' => ['required', 'string'],
            self::HONEYPOT_FIELD => ['nullable', 'string'],
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
                $this->formOpenedAt = $openedAt;
            },
        ];
    }

    /**
     * Ciri pengirim bot: kolom jebakan terisi, atau formulir dikirim lebih cepat dari batas wajar.
     */
    public function looksAutomated(): bool
    {
        $tooFast = $this->formOpenedAt !== null
            && now()->getTimestamp() - $this->formOpenedAt < (int) config('pemdi.contact.min_seconds');

        return $this->filled(self::HONEYPOT_FIELD) || $tooFast;
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
