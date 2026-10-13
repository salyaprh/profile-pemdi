<?php

use App\Models\ContactMessage;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Hapus pesan kontak yang melewati masa simpan (config pemdi.contact.retention_months). Butuh cron
// di server: `* * * * * cd /path/backend && php artisan schedule:run >> /dev/null 2>&1`.
Schedule::command('model:prune', ['--model' => [ContactMessage::class]])->daily();
