<?php

namespace Database\Seeders;

use App\Enums\ArticleStatus;
use App\Enums\Role;
use App\Models\Article;
use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Mengisi konten PLACEHOLDER yang sebelumnya tertulis di frontend (36 artikel, 3 kategori),
 * agar situs tetap berisi sampai konten resmi dimasukkan lewat CMS. Aman dijalankan ulang.
 */
class PlaceholderContentSeeder extends Seeder
{
    public function run(): void
    {
        /** @var array{categories: list<string>, paragraphs: list<string>, articles: list<array{title: string, excerpt: string, author: string, date: string, category: string, cover_url: string}>} $data */
        $data = json_decode(
            (string) file_get_contents(database_path('seeders/data/placeholder-content.json')),
            true,
            flags: JSON_THROW_ON_ERROR,
        );

        $categories = collect($data['categories'])->mapWithKeys(fn (string $name) => [
            $name => Category::updateOrCreate(['slug' => Str::slug($name)], ['name' => $name]),
        ]);

        $bodyHtml = collect($data['paragraphs'])->map(fn (string $text) => '<p>'.e($text).'</p>')->implode("\n");

        foreach ($data['articles'] as $item) {
            $article = Article::withTrashed()->firstOrNew(['slug' => Str::slug($item['title'])]);
            $article->fill([
                'title' => $item['title'],
                'excerpt' => $item['excerpt'],
                'body_html' => $bodyHtml,
                'cover_url' => $item['cover_url'],
                'category_id' => $categories[$item['category']]->id,
            ]);
            $article->author_id = $this->placeholderAuthor($item['author'])->id;
            $article->status = ArticleStatus::Terbit;
            $article->published_at = Carbon::parse($item['date'].' 09:00', 'Asia/Jakarta')->utc();
            $article->save();
        }
    }

    /**
     * Akun penulis placeholder: nonaktif dengan kata sandi acak, jadi tidak bisa dipakai login.
     */
    private function placeholderAuthor(string $name): User
    {
        $user = User::firstOrNew(['email' => Str::slug($name).'@placeholder.invalid']);

        if (! $user->exists) {
            $user->fill(['name' => $name, 'password' => Str::password(32)]);
            $user->role = Role::Penulis;
            $user->is_active = false;
            $user->save();
        }

        return $user;
    }
}
