<?php

namespace Pterodactyl\Addons\VersionChanger\Http\Requests;

use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class InstallVersionRequest extends ClientApiRequest
{
    public function permission(): string
    {
        return 'versions.install';
    }

    public function rules(): array
    {
        return [
            'group' => 'required|integer',
            // A version id for download groups, an egg id for egg groups.
            'version' => 'required|integer',
            'wipe' => 'sometimes|boolean',
        ];
    }
}
