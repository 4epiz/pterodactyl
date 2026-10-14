<?php

namespace Pterodactyl\Repositories\Wings;

use Webmozart\Assert\Assert;
use Pterodactyl\Models\Server;
use GuzzleHttp\Exception\TransferException;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;

class DaemonDownloadRepository extends DaemonRepository
{
    /**
     * Asks Wings to download a file into the server's folder and waits until
     * the download has finished.
     *
     * @throws DaemonConnectionException
     */
    public function download(string $url, string $directory, string $filename, int $timeout): void
    {
        Assert::isInstanceOf($this->server, Server::class);

        try {
            $this->getHttpClient()->post(sprintf('/api/servers/%s/files/pull', $this->server->uuid), [
                'json' => ['url' => $url, 'root' => $directory, 'file_name' => $filename, 'foreground' => true],
                'timeout' => $timeout,
            ]);
        } catch (TransferException $exception) {
            throw new DaemonConnectionException($exception);
        }
    }
}
