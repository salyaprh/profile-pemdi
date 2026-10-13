<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ActivityAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\CategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\ActivityLog;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

/**
 * Daftar kategori (untuk semua pengguna CMS, dipakai di formulir artikel); tambah, ubah, dan hapus
 * khusus Admin (middleware admin di routes/api.php).
 */
class CategoryController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $categories = Category::query()
            ->withCount(['articles' => fn ($query) => $query->withTrashed()])
            ->orderBy('name')
            ->get();

        return CategoryResource::collection($categories);
    }

    public function store(CategoryRequest $request): JsonResponse
    {
        $name = $request->string('name')->value();
        $category = Category::create(['name' => $name, 'slug' => $this->uniqueSlug($name)]);

        ActivityLog::record(ActivityAction::KategoriDibuat, "Membuat kategori \"{$category->name}\".", $category);

        return (new CategoryResource($category->loadCount('articles')))->response()->setStatusCode(201);
    }

    public function update(CategoryRequest $request, Category $category): CategoryResource
    {
        $oldName = $category->name;
        // Slug tetap agar tautan filter kategori di situs publik tidak berubah.
        $category->update(['name' => $request->string('name')->value()]);

        ActivityLog::record(ActivityAction::KategoriDiperbarui, "Mengganti nama kategori \"{$oldName}\" menjadi \"{$category->name}\".", $category);

        return new CategoryResource($category->loadCount(['articles' => fn ($query) => $query->withTrashed()]));
    }

    public function destroy(Category $category): Response
    {
        $used = $category->articles()->withTrashed()->count();
        abort_if(
            $used > 0,
            409,
            "Kategori ini masih dipakai {$used} artikel (termasuk yang di sampah). Pindahkan artikelnya ke kategori lain terlebih dahulu.",
        );

        ActivityLog::record(ActivityAction::KategoriDihapus, "Menghapus kategori \"{$category->name}\".", $category);
        $category->delete();

        return response()->noContent();
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'kategori';
        $slug = $base;
        for ($suffix = 2; Category::where('slug', $slug)->exists(); $suffix++) {
            $slug = "{$base}-{$suffix}";
        }

        return $slug;
    }
}
