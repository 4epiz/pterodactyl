<?php

namespace Pterodactyl\Http\Middleware\Api\Client\Server;

use Illuminate\Http\Request;
use Pterodactyl\Models\Server;
use Pterodactyl\Services\Servers\GameDetector;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Limits a server route to servers running one of the given games, e.g.
 * RequireGame::class . ':minecraft'. Games are detected the same way as in the
 * client area, see GameDetector.
 */
class RequireGame
{
    public function __construct(private GameDetector $detector)
    {
    }

    public function handle(Request $request, \Closure $next, string ...$games): mixed
    {
        $server = $request->route()->parameter('server');

        if (!$server instanceof Server || !$this->detector->is($server, ...$games)) {
            throw new NotFoundHttpException('This feature is not available for this server.');
        }

        return $next($request);
    }
}
