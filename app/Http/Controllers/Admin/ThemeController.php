<?php

namespace Pterodactyl\Http\Controllers\Admin;

use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;
use Prologue\Alerts\AlertsMessageBag;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Theme\ThemeSettingsService;
use Pterodactyl\Http\Requests\Admin\Theme\ThemeSettingsFormRequest;

class ThemeController extends Controller
{
    public function __construct(private AlertsMessageBag $alert, private ThemeSettingsService $theme)
    {
    }

    /**
     * Render the theme settings page.
     */
    public function index(): View
    {
        return view('admin.theme.index', [
            'theme' => $this->theme->get(),
            'accents' => ThemeSettingsService::ACCENTS,
            'modes' => ThemeSettingsService::MODES,
            'announcementTypes' => ThemeSettingsService::ANNOUNCEMENT_TYPES,
            'games' => ThemeSettingsService::GAMES,
        ]);
    }

    /**
     * Save the theme settings.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     * @throws \Pterodactyl\Exceptions\Repository\RecordNotFoundException
     */
    public function update(ThemeSettingsFormRequest $request): RedirectResponse
    {
        $this->theme->save($request->normalize());
        $this->alert->success('Theme settings saved. Changes appear the next time a page is loaded.')->flash();

        return redirect()->route('admin.theme');
    }
}
