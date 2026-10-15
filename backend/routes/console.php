<?php

use App\Models\ActivityLog;
use App\Models\ContactMessage;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Hapus pesan kontak dan log aktivitas yang melewati masa simpan (config pemdi.contact.retention_months
// dan pemdi.activity_retention_months). Butuh cron di server:
// `* * * * * cd /path/backend && php artisan schedule:run >> /dev/null 2>&1`.
Schedule::command('model:prune', ['--model' => [ContactMessage::class, ActivityLog::class]])->daily();

// Hapus gambar unggahan yang tidak dipakai artikel mana pun (config pemdi.media_orphan_days).
Schedule::command('pemdi:bersihkan-media')->daily();
