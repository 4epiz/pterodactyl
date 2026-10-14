<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Addons\VersionChanger\Http\EnsureInstalled;
use Pterodactyl\Http\Middleware\Api\Client\Server\RequireGame;
use Pterodactyl\Addons\VersionChanger\Http\ClientVersionController;

// Endpoint: /api/client/servers/{server}/versions
Route::group(['prefix' => '/versions', 'middleware' => [RequireGame::class . ':minecraft', EnsureInstalled::class]], function () {
    Route::get('/', [ClientVersionController::class, 'index']);
    Route::post('/install', [ClientVersionController::class, 'install']);
});
