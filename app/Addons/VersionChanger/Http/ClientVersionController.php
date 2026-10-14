<?php

namespace Pterodactyl\Addons\VersionChanger\Http;

use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Server;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Addons\VersionChanger\VersionInstaller;
use Pterodactyl\Addons\VersionChanger\Models\VersionGroup;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Addons\VersionChanger\Http\Requests\ViewVersionsRequest;
use Pterodactyl\Addons\VersionChanger\Http\Requests\InstallVersionRequest;

class ClientVersionController extends ClientApiController
{
    public function __construct(private VersionInstaller $installer)
    {
        parent::__construct();
    }

    /**
     * Lists the versions the server can switch to.
     */
    public function index(ViewVersionsRequest $request, Server $server): array
    {
        $current = $this->installer->current($server);

        $groups = $this->installer->groupsFor($server)->map(function (VersionGroup $group) use ($server, $current) {
            if ($group->isDownload()) {
                $versions = $group->versions->map(fn ($version) => [
                    'id' => $version->id,
                    'name' => $version->name,
                    'current' => $current?->version_id === $version->id,
                ]);
            } else {
                $versions = Egg::query()->whereIn('id', $group->eggIds())->orderBy('name')->get(['id', 'name'])
                    ->map(fn (Egg $egg) => [
                        'id' => $egg->id,
                        'name' => $egg->name,
                        'current' => $server->egg_id === $egg->id,
                    ]);
            }

            return [
                'id' => $group->id,
                'name' => $group->name,
                'type' => $group->type,
                'versions' => $versions->values(),
            ];
        })->filter(fn (array $group) => count($group['versions']) > 0)->values();

        return [
            'groups' => $groups,
            'current' => $current ? [
                'name' => $current->name,
                'installed_at' => $current->installed_at->toAtomString(),
            ] : null,
        ];
    }

    /**
     * Installs a version on the server.
     */
    public function install(InstallVersionRequest $request, Server $server): array
    {
        $group = $this->installer->groupsFor($server)->firstWhere('id', (int) $request->input('group'));
        if (!$group) {
            throw new DisplayException('That version is not available for this server.');
        }

        $wipe = $request->boolean('wipe');
        $id = (int) $request->input('version');

        if ($group->isDownload()) {
            $version = $group->versions->firstWhere('id', $id);
            if (!$version) {
                throw new DisplayException('That version is not available for this server.');
            }

            $this->installer->installDownload($server, $group, $version, $wipe);
            $name = $version->name;
        } else {
            $egg = in_array($id, $group->eggIds(), true) ? Egg::query()->find($id) : null;
            if (!$egg) {
                throw new DisplayException('That version is not available for this server.');
            }

            $this->installer->installEgg($server, $group, $egg, $wipe);
            $name = $egg->name;
        }

        Activity::event('server:version.install')
            ->property(['group' => $group->name, 'version' => $name, 'wipe' => $wipe])
            ->log();

        return ['name' => $name, 'reinstalling' => !$group->isDownload()];
    }
}
