<?php

namespace Pterodactyl\Addons\ServerProperties\Http\Requests;

use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class UpdatePropertiesRequest extends ClientApiRequest
{
    public function permission(): string
    {
        return 'properties.update';
    }

    public function rules(): array
    {
        return [
            'values' => 'required|array|max:500',
            // A value may not span lines, which would let it add other keys.
            'values.*' => ['present', 'nullable', 'string', 'max:4096', 'not_regex:/[\r\n]/'],
        ];
    }

    public function messages(): array
    {
        return ['values.*.not_regex' => 'Property values cannot contain line breaks.'];
    }
}
