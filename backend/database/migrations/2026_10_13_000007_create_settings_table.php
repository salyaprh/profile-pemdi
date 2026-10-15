<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Pengaturan situs sebagai pasangan kunci-nilai (nilai JSON). Saat ini hanya kunci `site`
        // (App\Support\SiteSettings); nilai bawaan ada di kode, jadi tabel kosong tetap valid.
        Schema::create('settings', function (Blueprint $table) {
            $table->string('key', 50)->primary();
            $table->json('value');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
