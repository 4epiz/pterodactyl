<?php

namespace Pterodactyl\Tests\Integration\Addons;

use Pterodactyl\Models\Egg;
use Pterodactyl\Models\User;
use Pterodactyl\Models\Server;

/**
 * The default test server uses the BungeeCord egg, a proxy. These helpers
 * create servers on other eggs to test which addons each kind of server gets.
 */
trait UsesMinecraftServers
{
    /**
     * @return array{User, Server}
     */
    protected function accountWithEgg(string $egg, array $permissions = []): array
    {
        [$user, $server] = $this->generateTestAccount($permissions);

        $model = Egg::query()->where('name', $egg)->firstOrFail();
        $server->forceFill(['egg_id' => $model->id, 'nest_id' => $model->nest_id])->save();

        return [$user, $server->refresh()->load('egg')];
    }

    /**
     * A Paper server, which gets every Minecraft addon.
     *
     * @return array{User, Server}
     */
    protected function paperAccount(array $permissions = []): array
    {
        return $this->accountWithEgg('Paper', $permissions);
    }
}
