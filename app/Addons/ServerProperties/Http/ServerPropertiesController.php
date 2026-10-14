<?php

namespace Pterodactyl\Addons\ServerProperties\Http;

use Pterodactyl\Models\Server;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Addons\ServerProperties\PropertiesFile;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Exceptions\Http\Server\FileSizeTooLargeException;
use Pterodactyl\Addons\ServerProperties\Http\Requests\ViewPropertiesRequest;
use Pterodactyl\Addons\ServerProperties\Http\Requests\UpdatePropertiesRequest;

class ServerPropertiesController extends ClientApiController
{
    private const FILE = 'server.properties';

    // server.properties is a few kilobytes; anything far larger is not one.
    private const MAX_SIZE = 512 * 1024;

    public function __construct(private DaemonFileRepository $files)
    {
        parent::__construct();
    }

    /**
     * Returns the properties in the server's server.properties file. A server
     * that has not been started yet has no file; that is not an error.
     */
    public function index(ViewPropertiesRequest $request, Server $server): array
    {
        $file = $this->load($server);

        return ['exists' => !is_null($file), 'properties' => $file?->properties() ?? []];
    }

    /**
     * Updates the given properties, leaving the rest of the file untouched.
     */
    public function update(UpdatePropertiesRequest $request, Server $server): array
    {
        $file = $this->load($server);
        if (is_null($file)) {
            throw new DisplayException('This server has no server.properties file yet. Start the server once to create it.', null, DisplayException::LEVEL_WARNING);
        }

        $changed = $file->update($request->validated()['values']);

        if (count($changed) > 0) {
            $this->files->setServer($server)->putContent(self::FILE, $file->contents());

            Activity::event('server:properties.update')->property('keys', $changed)->log();
        }

        return ['exists' => true, 'properties' => $file->properties(), 'changed' => $changed];
    }

    /**
     * Reads server.properties, or returns null when the server does not have
     * one. Checks the folder listing first rather than relying on the error
     * Wings returns for a missing file, which differs between Wings versions.
     */
    private function load(Server $server): ?PropertiesFile
    {
        $files = $this->files->setServer($server);

        $exists = collect($files->getDirectory('/'))
            ->contains(fn (array $file) => $file['name'] === self::FILE && ($file['file'] ?? true));

        if (!$exists) {
            return null;
        }

        try {
            return new PropertiesFile($files->getContent(self::FILE, self::MAX_SIZE));
        } catch (FileSizeTooLargeException) {
            throw new DisplayException('The server.properties file is too large to edit here.');
        }
    }
}
