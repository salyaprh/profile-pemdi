<?php

namespace App\Console\Commands;

use App\Models\Article;
use App\Models\Media;
use App\Support\MediaUrl;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

/**
 * Menghapus gambar unggahan yang tidak dipakai artikel mana pun, supaya folder unggahan tidak
 * membesar tanpa batas. Artikel di sampah tetap dihitung memakai gambarnya (bisa dipulihkan).
 * Gambar yang baru diunggah dibiarkan selama masa tenggang (config pemdi.media_orphan_days).
 */
class CleanOrphanMediaCommand extends Command
{
    protected $signature = 'pemdi:bersihkan-media';

    protected $description = 'Menghapus gambar unggahan yang tidak dipakai artikel mana pun';

    public function handle(): int
    {
        $used = $this->usedUuids();
        $cutoff = now()->subDays((int) config('pemdi.media_orphan_days'));
        $disk = Storage::disk('public');
        $removed = 0;

        Media::query()->where('created_at', '<', $cutoff)->chunkById(200, function (Collection $chunk) use ($used, $disk, &$removed) {
            foreach ($chunk as $media) {
                if (isset($used[pathinfo($media->path, PATHINFO_FILENAME)])) {
                    continue;
                }
                $disk->delete([$media->path, $media->og_path]);
                $media->delete();
                $removed++;
            }
        });

        $this->info("Gambar tak terpakai dihapus: {$removed}.");

        return self::SUCCESS;
    }

    /** @return array<string, true> UUID gambar yang masih disebut sampul atau isi artikel. */
    private function usedUuids(): array
    {
        $used = [];

        Article::withTrashed()->select(['id', 'cover_url', 'body_html'])->chunkById(200, function (Collection $chunk) use (&$used) {
            foreach ($chunk as $article) {
                foreach (MediaUrl::uuidsIn($article->cover_url.' '.$article->body_html) as $uuid) {
                    $used[$uuid] = true;
                }
            }
        });

        return $used;
    }
}
