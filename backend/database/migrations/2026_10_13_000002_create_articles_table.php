<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->string('title', 200);
            $table->string('slug', 220)->unique();
            $table->string('excerpt', 300);
            // HTML hasil editor WYSIWYG yang SUDAH disaring di server sebelum disimpan.
            $table->longText('body_html');
            $table->string('cover_url')->nullable();
            $table->string('source')->nullable();
            // restrictOnDelete: kategori yang masih dipakai dan penulis artikel tidak boleh terhapus.
            $table->foreignId('category_id')->constrained()->restrictOnDelete();
            $table->foreignId('author_id')->constrained('users')->restrictOnDelete();
            $table->string('status', 20)->default('draf');
            $table->text('review_note')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'published_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
