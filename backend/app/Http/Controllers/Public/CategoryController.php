<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;

/** Kategori yang punya artikel terbit, untuk filter portofolio dan footer (GET /api/categories). */
class CategoryController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $categories = Category::query()
            ->whereHas('articles', fn ($query) => $query->published())
            ->withCount(['articles' => fn ($query) => $query->published()])
            ->orderBy('name')
            ->get()
            ->map(fn (Category $category): array => [
                'name' => $category->name,
                'slug' => $category->slug,
                'articles_count' => (int) $category->getAttribute('articles_count'),
            ]);

        return response()->json(['data' => $categories]);
    }
}
