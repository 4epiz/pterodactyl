<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Middleware\Api\Client\Server\RequireGame;
use Pterodactyl\Addons\ServerProperties\Http\ServerPropertiesController;

// Endpoint: /api/client/servers/{server}/properties
Route::group(['prefix' => '/properties', 'middleware' => RequireGame::class . ':minecraft/bukkit,minecraft/sponge,minecraft/modded,minecraft/bedrock,minecraft/vanilla,minecraft/unknown'], function () {
    Route::get('/', [ServerPropertiesController::class, 'index']);
    Route::post('/', [ServerPropertiesController::class, 'update']);
});
