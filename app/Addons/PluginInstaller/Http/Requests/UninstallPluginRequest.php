<?php

namespace Pterodactyl\Addons\PluginInstaller\Http\Requests;

use Pterodactyl\Models\Permission;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class UninstallPluginRequest extends ClientApiRequest
{
    public function permission(): string
    {
        return Permission::ACTION_FILE_DELETE;
    }

    public function rules(): array
    {
        return [
            // A .jar directly inside the plugins folder.
            'file' => ['required', 'string', 'max:255', 'regex:/^[^\/\\\\]+\.jar$/i', 'not_regex:/^\.\.?$/'],
        ];
    }
}
