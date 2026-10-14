<?php

namespace Pterodactyl\Addons\ServerProperties\Http;

use Pterodactyl\Models\Server;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Addons\ServerProperties\PropertiesFile;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Exceptions\Http\Server\FileSizeTooLargeException;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;
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
     * Returns the properties in the server's server.properties file.
     */
    public function index(ViewPropertiesRequest $request, Server $server): array
    {
        return ['properties' => $this->load($server)->properties()];
    }

    /**
     * Updates the given properties, leaving the rest of the file untouched.
     */
    public function update(UpdatePropertiesRequest $request, Server $server): array
    {
        $file = $this->load($server);
        $changed = $file->update($request->validated()['values']);

        if (count($changed) > 0) {
            $this->files->setServer($server)->putContent(self::FILE, $file->contents());

            Activity::event('server:properties.update')->property('keys', $changed)->log();
        }

        return ['properties' => $file->properties(), 'changed' => $changed];
    }

    private function load(Server $server): PropertiesFile
    {
        try {
            return new PropertiesFile($this->files->setServer($server)->getContent(self::FILE, self::MAX_SIZE));
        } catch (DaemonConnectionException $exception) {
            if ($exception->getStatusCode() === 404) {
                throw new DisplayException('This server has no server.properties file yet. Start the server once to create it.', null, DisplayException::LEVEL_WARNING);
            }

            throw $exception;
        } catch (FileSizeTooLargeException) {
            throw new DisplayException('The server.properties file is too large to edit here.');
        }
    }
}
