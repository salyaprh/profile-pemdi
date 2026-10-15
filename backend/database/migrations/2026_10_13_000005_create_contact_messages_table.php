<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pesan dari formulir "Hubungi kami". Data pribadi (nama, email, ponsel, subjek, isi) disimpan
     * terenkripsi dengan APP_KEY (cast `encrypted` di App\Models\ContactMessage), jadi kolomnya
     * `text`. Alamat IP pengirim tidak disimpan; pembatasan laju memakai cache.
     */
    public function up(): void
    {
        Schema::create('contact_messages', function (Blueprint $table) {
            $table->id();
            $table->text('name');
            $table->text('email');
            $table->text('phone')->nullable();
            $table->text('subject');
            $table->text('message');
            $table->timestamp('read_at')->nullable()->index();
            $table->timestamps();

            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_messages');
    }
};
