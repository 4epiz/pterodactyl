<?php

namespace Pterodactyl\Addons\PluginInstaller\Http\Requests;

use Illuminate\Validation\Rule;
use Pterodactyl\Models\Permission;
use Pterodactyl\Addons\PluginInstaller\PluginSources;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class InstallPluginRequest extends ClientApiRequest
{
    public function permission(): string
    {
        return Permission::ACTION_FILE_CREATE;
    }

    public function rules(): array
    {
        return [
            'source' => ['required', Rule::in(PluginSources::SOURCES)],
            'id' => 'required|string|max:64|regex:/^[A-Za-z0-9]+$/',
            'version' => 'nullable|string|max:64|regex:/^[A-Za-z0-9]+$/',
        ];
    }
}
