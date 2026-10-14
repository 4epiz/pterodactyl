<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Addons\VersionChanger\Http\EnsureInstalled;
use Pterodactyl\Addons\VersionChanger\Http\AdminVersionController;

// Endpoint: /admin/addons/versions
Route::group(['prefix' => '/addons/versions', 'middleware' => EnsureInstalled::class], function () {
    Route::get('/', [AdminVersionController::class, 'index'])->name('admin.addons.versions');
    Route::post('/', [AdminVersionController::class, 'storeGroup']);

    Route::group(['prefix' => '/{group}', 'where' => ['group' => '[0-9]+']], function () {
        Route::get('/', [AdminVersionController::class, 'view'])->name('admin.addons.versions.view');
        Route::patch('/', [AdminVersionController::class, 'updateGroup']);
        Route::delete('/', [AdminVersionController::class, 'destroyGroup']);

        Route::post('/versions', [AdminVersionController::class, 'storeVersion'])->name('admin.addons.versions.store');
        Route::get('/versions/{version}', [AdminVersionController::class, 'editVersion'])
            ->where('version', '[0-9]+')
            ->name('admin.addons.versions.version');
        Route::patch('/versions/{version}', [AdminVersionController::class, 'updateVersion'])->where('version', '[0-9]+');
        Route::delete('/versions/{version}', [AdminVersionController::class, 'destroyVersion'])->where('version', '[0-9]+');
    });
});
