<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ActivityAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\MediaUploadRequest;
use App\Http\Resources\MediaResource;
use App\Models\ActivityLog;
use App\Support\MediaStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\UploadedFile;

class MediaController extends Controller
{
    public function store(MediaUploadRequest $request, MediaStorage $storage): JsonResponse
    {
        $file = $request->file('file');
        abort_unless($file instanceof UploadedFile, 422, 'Pilih gambar yang akan diunggah.');

        $media = $storage->store($file, $request->user());
        ActivityLog::record(ActivityAction::MediaDiunggah, "Mengunggah gambar \"{$media->original_name}\".", $media);

        return (new MediaResource($media))->response()->setStatusCode(201);
    }
}
