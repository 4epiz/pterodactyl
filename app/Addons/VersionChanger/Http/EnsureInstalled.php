<?php

namespace Pterodactyl\Addons\VersionChanger\Http;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Pterodactyl\Exceptions\DisplayException;

/**
 * Explains what to do when the addon's database tables do not exist yet
 * (php artisan migrate has not been run), instead of failing with a 500.
 */
class EnsureInstalled
{
    private static ?bool $installed = null;

    public function handle(Request $request, \Closure $next): mixed
    {
        self::$installed ??= Schema::hasTable('version_changer_groups')
            && Schema::hasTable('version_changer_versions')
            && Schema::hasTable('version_changer_installs');

        if (self::$installed) {
            return $next($request);
        }

        if ($request->is('admin/*')) {
            return response()->view('addons.version-changer.not-installed', [], 503);
        }

        throw new DisplayException('Versions are not set up on this panel yet. Ask your host to finish installing the version changer.');
    }
}
