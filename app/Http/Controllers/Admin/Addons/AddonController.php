<?php

namespace Pterodactyl\Http\Controllers\Admin\Addons;

use Illuminate\View\View;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Addons\AddonRegistry;

class AddonController extends Controller
{
    /**
     * Lists the addons installed in app/Addons.
     */
    public function index(): View
    {
        $pending = AddonRegistry::pendingMigrations();

        $addons = collect(AddonRegistry::all())->map(fn (array $manifest, string $folder) => [
            'folder' => $folder,
            'name' => $manifest['name'] ?? $folder,
            'description' => $manifest['description'] ?? null,
            'version' => $manifest['version'] ?? null,
            'admin_nav' => $manifest['admin_nav'] ?? null,
            'client_pages' => $manifest['client_pages'] ?? [],
            'permissions' => array_keys($manifest['permissions'] ?? []),
            'pending' => $pending[$manifest['name'] ?? $folder] ?? [],
        ])->values();

        return view('admin.addons.index', ['addons' => $addons]);
    }
}
