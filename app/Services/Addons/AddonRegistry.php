<?php

namespace Pterodactyl\Services\Addons;

use Illuminate\Support\Arr;

/**
 * Discovers addons installed in app/Addons. Each addon is a folder with an
 * addon.php manifest that returns an array:
 *
 *   return [
 *       'name' => 'Example',
 *       // Subuser permissions, in the same format as Permission::$permissions.
 *       'permissions' => ['example' => ['description' => '...', 'keys' => ['manage' => '...']]],
 *       // Route files, loaded inside the matching route group.
 *       'routes' => [
 *           'admin' => __DIR__ . '/routes/admin.php',          // /admin, admin middleware
 *           'client-server' => __DIR__ . '/routes/client.php', // /api/client/servers/{server}
 *       ],
 *       // Folder with database migrations.
 *       'migrations' => __DIR__ . '/Migrations',
 *       // Sidebar link in the admin area.
 *       'admin_nav' => ['route' => 'admin.example', 'label' => 'Example', 'icon' => 'fa-puzzle-piece'],
 *   ];
 *
 * This keeps addons out of the panel's own files: installing one is copying
 * its folders, removing one is deleting them.
 */
class AddonRegistry
{
    private static ?array $manifests = null;

    /**
     * Returns every addon manifest, keyed by folder name.
     */
    public static function all(): array
    {
        if (!is_null(self::$manifests)) {
            return self::$manifests;
        }

        self::$manifests = [];
        foreach (glob(app_path('Addons/*/addon.php')) ?: [] as $file) {
            $manifest = require $file;
            if (is_array($manifest)) {
                self::$manifests[basename(dirname($file))] = $manifest;
            }
        }

        ksort(self::$manifests);

        return self::$manifests;
    }

    /**
     * Loads the route files every addon registered for the given group. Call
     * this from inside the matching group in the routes folder.
     */
    public static function routes(string $group): void
    {
        foreach (self::all() as $manifest) {
            $file = Arr::get($manifest, "routes.$group");
            if ($file && is_file($file)) {
                require $file;
            }
        }
    }

    /**
     * Subuser permissions added by addons.
     */
    public static function permissions(): array
    {
        return array_merge(...array_values(array_map(
            fn (array $manifest) => $manifest['permissions'] ?? [],
            self::all()
        )) ?: [[]]);
    }

    /**
     * Links added to the admin area sidebar.
     */
    public static function adminNavigation(): array
    {
        return array_values(array_filter(array_map(
            fn (array $manifest) => $manifest['admin_nav'] ?? null,
            self::all()
        )));
    }

    /**
     * Migration folders of all addons.
     */
    public static function migrationPaths(): array
    {
        return array_values(array_filter(array_map(
            fn (array $manifest) => $manifest['migrations'] ?? null,
            self::all()
        ), fn ($path) => $path && is_dir($path)));
    }
}
