<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Addons\VersionChanger\Http\ClientVersionController;

// Endpoint: /api/client/servers/{server}/versions
Route::group(['prefix' => '/versions'], function () {
    Route::get('/', [ClientVersionController::class, 'index']);
    Route::post('/install', [ClientVersionController::class, 'install']);
});
