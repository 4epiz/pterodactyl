<?php

namespace Pterodactyl\Addons\VersionChanger\Http\Requests;

use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class ViewVersionsRequest extends ClientApiRequest
{
    public function permission(): string
    {
        return 'versions.read';
    }
}
