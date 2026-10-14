<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Middleware\Api\Client\Server\RequireGame;
use Pterodactyl\Addons\PluginInstaller\Http\PluginInstallerController;

// Endpoint: /api/client/servers/{server}/plugins
Route::group(['prefix' => '/plugins', 'middleware' => RequireGame::class . ':minecraft'], function () {
    Route::get('/', [PluginInstallerController::class, 'search']);
    Route::get('/installed', [PluginInstallerController::class, 'installed']);
    Route::get('/{source}/{id}/versions', [PluginInstallerController::class, 'versions'])
        ->where(['source' => 'spigot|modrinth|polymart', 'id' => '[A-Za-z0-9]+']);
    Route::post('/install', [PluginInstallerController::class, 'install']);
    Route::post('/uninstall', [PluginInstallerController::class, 'uninstall']);
});
