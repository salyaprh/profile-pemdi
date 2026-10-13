<?php

namespace Database\Factories;

use App\Enums\ArticleStatus;
use App\Models\Article;
use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Article>
 */
class ArticleFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = rtrim(fake()->unique()->sentence(6), '.');

        return [
            'title' => $title,
            'slug' => Str::slug($title),
            'excerpt' => fake()->sentence(18),
            'body_html' => '<p>'.fake()->paragraph().'</p>',
            'cover_url' => null,
            'source' => null,
            'category_id' => Category::factory(),
            'author_id' => User::factory(),
            'status' => ArticleStatus::Draf,
            'review_note' => null,
            'published_at' => null,
        ];
    }

    public function inReview(): static
    {
        return $this->state(fn () => ['status' => ArticleStatus::Ditinjau]);
    }

    public function published(): static
    {
        return $this->state(fn () => [
            'status' => ArticleStatus::Terbit,
            'published_at' => now()->subDay(),
        ]);
    }
}
