<?php

namespace Pterodactyl\Addons\ServerProperties\Http\Requests;

use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class ViewPropertiesRequest extends ClientApiRequest
{
    public function permission(): string
    {
        return 'properties.read';
    }
}
