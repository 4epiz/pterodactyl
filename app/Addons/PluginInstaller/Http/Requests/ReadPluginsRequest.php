<?php

namespace Pterodactyl\Addons\PluginInstaller\Http\Requests;

use Illuminate\Validation\Rule;
use Pterodactyl\Models\Permission;
use Pterodactyl\Addons\PluginInstaller\PluginSources;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class ReadPluginsRequest extends ClientApiRequest
{
    public function permission(): string
    {
        return Permission::ACTION_FILE_READ;
    }

    public function rules(): array
    {
        return [
            'source' => ['sometimes', Rule::in(PluginSources::SOURCES)],
            'query' => 'nullable|string|max:100',
            'page' => 'sometimes|integer|min:1|max:200',
            'category' => ['nullable', 'integer', Rule::in(array_keys(PluginSources::SPIGOT_CATEGORIES))],
            'version' => ['nullable', 'string', 'regex:/^\d+\.\d+(\.\d+)?$/'],
        ];
    }
}
