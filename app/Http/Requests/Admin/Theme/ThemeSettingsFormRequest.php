<?php

namespace Pterodactyl\Http\Requests\Admin\Theme;

use Illuminate\Validation\Rule;
use Pterodactyl\Services\Theme\ThemeSettingsService;
use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class ThemeSettingsFormRequest extends AdminFormRequest
{
    /**
     * Absolute http(s) URLs or paths on this panel. Quotes, brackets and
     * whitespace are rejected because URLs end up in CSS url() values.
     */
    private const URL = ['nullable', 'string', 'max:2048', 'regex:/^(https?:\/\/|\/)[^\s"\'()<>\\\\]*$/i'];

    public function rules(): array
    {
        $rules = [
            'branding.subtitle' => 'nullable|string|max:60',
            'branding.logo_url' => self::URL,
            'branding.login_title' => 'nullable|string|max:80',
            'branding.login_subtitle' => 'nullable|string|max:200',
            'branding.footer_text' => 'nullable|string|max:200',

            'appearance.accent' => ['required', Rule::in(ThemeSettingsService::ACCENTS)],
            'appearance.allow_accent_change' => 'boolean',
            'appearance.default_mode' => ['required', Rule::in(ThemeSettingsService::MODES)],
            'appearance.allow_mode_change' => 'boolean',
            'appearance.show_greeting' => 'boolean',
            'appearance.show_featured' => 'boolean',

            'announcement.enabled' => 'boolean',
            'announcement.type' => ['required', Rule::in(ThemeSettingsService::ANNOUNCEMENT_TYPES)],
            'announcement.title' => 'nullable|string|max:80',
            'announcement.message' => 'nullable|string|max:500|required_if:announcement.enabled,1',
            'announcement.link_url' => self::URL,
            'announcement.link_label' => 'nullable|string|max:40',
            'announcement.dismissible' => 'boolean',

            'links.billing_url' => self::URL,
            'links.support_url' => self::URL,
            'links.status_url' => self::URL,
            'links.discord_url' => self::URL,
        ];

        foreach (array_keys(ThemeSettingsService::GAMES) as $game) {
            $rules["game_images.$game"] = self::URL;
        }

        return $rules;
    }

    public function attributes(): array
    {
        $attributes = [
            'branding.logo_url' => 'Logo URL',
            'announcement.message' => 'Announcement message',
            'announcement.link_url' => 'Announcement link',
            'links.billing_url' => 'Billing link',
            'links.support_url' => 'Support link',
            'links.status_url' => 'Status page link',
            'links.discord_url' => 'Discord link',
        ];

        foreach (ThemeSettingsService::GAMES as $game => $label) {
            $attributes["game_images.$game"] = "$label image";
        }

        return $attributes;
    }

    public function messages(): array
    {
        return [
            'regex' => 'The :attribute must start with http://, https:// or / and cannot contain spaces, quotes or brackets.',
            'announcement.message.required_if' => 'Write a message, or switch the announcement off.',
        ];
    }

    public function normalize(?array $only = null): array
    {
        return $this->validated();
    }
}
