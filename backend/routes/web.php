<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ArticleController;

// ADD THESE LINES:
Route::prefix('api')->group(function () {
    Route::apiResource('articles', ArticleController::class);
});
