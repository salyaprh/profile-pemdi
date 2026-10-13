<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Gambar unggahan CMS. Berkasnya sudah di-encode ulang ke WebP (lihat App\Support\MediaStorage).
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->string('path');
            $table->string('og_path');
            $table->string('original_name');
            $table->unsignedInteger('size');
            $table->unsignedSmallInteger('width');
            $table->unsignedSmallInteger('height');
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media');
    }
};
