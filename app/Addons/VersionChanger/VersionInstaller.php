<?php

namespace Pterodactyl\Addons\VersionChanger;

use Pterodactyl\Models\Egg;
use Pterodactyl\Models\User;
use Illuminate\Support\Carbon;
use Pterodactyl\Models\Server;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Services\Servers\ReinstallServerService;
use Pterodactyl\Addons\VersionChanger\Models\VersionEntry;
use Pterodactyl\Addons\VersionChanger\Models\VersionGroup;
use Pterodactyl\Repositories\Wings\DaemonServerRepository;
use Pterodactyl\Repositories\Wings\DaemonDownloadRepository;
use Pterodactyl\Services\Servers\StartupModificationService;
use Pterodactyl\Addons\VersionChanger\Models\InstalledVersion;

/**
 * Installs a version on a server using the endpoints of the stock Wings
 * daemon: list, delete, pull (download) and decompress.
 */
class VersionInstaller
{
    // Server jars can be large; give Wings time to download them.
    private const DOWNLOAD_TIMEOUT = 600;

    public function __construct(
        private DaemonFileRepository $files,
        private DaemonServerRepository $daemon,
        private StartupModificationService $startup,
        private ReinstallServerService $reinstall,
        private DaemonDownloadRepository $downloads,
    ) {
    }

    /**
     * Version groups the server can use, i.e. groups that list the server's egg.
     *
     * @return \Illuminate\Support\Collection<VersionGroup>
     */
    public function groupsFor(Server $server)
    {
        return VersionGroup::query()->with('versions')->orderBy('sort')->orderBy('id')->get()
            ->filter(fn (VersionGroup $group) => in_array($server->egg_id, $group->eggIds(), true))
            ->values();
    }

    /**
     * Downloads a version into the server's folder. Removes the .jar files in
     * the top folder first, or every file when $wipe is set.
     */
    public function installDownload(Server $server, VersionGroup $group, VersionEntry $version, bool $wipe): void
    {
        $this->ensureOffline($server);

        $files = $this->files->setServer($server);

        $listing = collect($files->getDirectory('/'));

        $remove = $wipe
            ? $listing->pluck('name')
            : $listing
                ->filter(fn (array $file) => ($file['file'] ?? false) && str_ends_with(strtolower($file['name']), '.jar'))
                ->pluck('name')
                // Always replace the target file, whatever its extension.
                ->merge($listing->pluck('name')->filter(fn ($name) => $name === $version->filename))
                ->unique()
                ->values();

        if ($remove->isNotEmpty()) {
            $files->deleteFiles('/', $remove->all());
        }

        $target = $version->extract ? $this->archiveName($version) : $version->filename;
        $this->downloads->setServer($server)->download($version->download_url, '/', $target, self::DOWNLOAD_TIMEOUT);

        if ($version->extract) {
            $files->decompressFile('/', $target);
            $files->deleteFiles('/', [$target]);
        }

        $this->remember($server, $group, $version->id, $version->name);
    }

    /**
     * Switches the server to another egg from an "egg" group and reinstalls
     * it, so the new egg's install script sets the server up. Deletes every
     * file first when $wipe is set.
     */
    public function installEgg(Server $server, VersionGroup $group, Egg $egg, bool $wipe): void
    {
        $this->ensureOffline($server);

        if ($server->skip_scripts) {
            throw new DisplayException('This server is set to skip egg install scripts, so its version cannot be changed this way. Ask an administrator for help.');
        }

        if ($wipe) {
            $files = $this->files->setServer($server);
            $names = collect($files->getDirectory('/'))->pluck('name')->all();
            if (count($names) > 0) {
                $files->deleteFiles('/', $names);
            }
        }

        $images = $egg->docker_images ?? [];
        $image = in_array($server->image, $images, true) ? $server->image : (array_values($images)[0] ?? $server->image);

        $this->startup->setUserLevel(User::USER_LEVEL_ADMIN);
        $server = $this->startup->handle($server, [
            'egg_id' => $egg->id,
            'docker_image' => $image,
            'startup' => $egg->startup,
            'skip_scripts' => $server->skip_scripts,
        ]);

        $this->reinstall->handle($server);

        $this->remember($server, $group, null, $egg->name);
    }

    public function current(Server $server): ?InstalledVersion
    {
        return InstalledVersion::query()->find($server->id);
    }

    private function remember(Server $server, VersionGroup $group, ?int $versionId, string $name): void
    {
        InstalledVersion::query()->updateOrCreate(
            ['server_id' => $server->id],
            ['group_id' => $group->id, 'version_id' => $versionId, 'name' => $name, 'installed_at' => Carbon::now()]
        );
    }

    /**
     * Replacing files under a running server can corrupt worlds, so require
     * the server to be stopped.
     */
    private function ensureOffline(Server $server): void
    {
        $state = $this->daemon->setServer($server)->getDetails()['state'] ?? 'offline';

        if ($state !== 'offline') {
            throw new DisplayException('Stop the server before changing its version.');
        }
    }

    private function archiveName(VersionEntry $version): string
    {
        $path = parse_url($version->download_url, PHP_URL_PATH) ?: '';
        $extension = preg_match('/\.(tar\.gz|tgz|tar|zip|gz|7z|rar|xz|bz2)$/i', $path, $matches) ? strtolower($matches[1]) : 'zip';

        return 'version-download.' . $extension;
    }
}
