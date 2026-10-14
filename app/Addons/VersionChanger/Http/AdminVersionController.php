<?php

namespace Pterodactyl\Addons\VersionChanger\Http;

use Illuminate\View\View;
use Pterodactyl\Models\Egg;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Http\RedirectResponse;
use Prologue\Alerts\AlertsMessageBag;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Addons\VersionChanger\Models\VersionEntry;
use Pterodactyl\Addons\VersionChanger\Models\VersionGroup;

class AdminVersionController extends Controller
{
    public function __construct(private AlertsMessageBag $alert)
    {
    }

    public function index(): View
    {
        return view('addons.version-changer.index', [
            'groups' => VersionGroup::query()->withCount('versions')->orderBy('sort')->orderBy('id')->get(),
            'eggs' => $this->eggs(),
            'types' => VersionGroup::TYPES,
        ]);
    }

    public function storeGroup(Request $request): RedirectResponse
    {
        $data = $request->validate($this->groupRules(true), [], $this->attributes());

        $group = VersionGroup::query()->create([
            'name' => $data['name'],
            'type' => $data['type'],
            'eggs' => array_map('intval', $data['eggs']),
            'sort' => (int) VersionGroup::query()->max('sort') + 1,
        ]);

        $this->alert->success('Version group created.')->flash();

        return $group->isDownload()
            ? redirect()->route('admin.addons.versions.view', $group->id)
            : redirect()->route('admin.addons.versions');
    }

    public function view(int $group): View
    {
        $group = VersionGroup::query()->with('versions')->findOrFail($group);

        return view('addons.version-changer.group', [
            'group' => $group,
            'eggs' => $this->eggs(),
            'types' => VersionGroup::TYPES,
        ]);
    }

    public function updateGroup(Request $request, int $group): RedirectResponse
    {
        $group = VersionGroup::query()->findOrFail($group);
        $data = $request->validate($this->groupRules(false), [], $this->attributes());

        $group->update([
            'name' => $data['name'],
            'eggs' => array_map('intval', $data['eggs']),
            'sort' => $data['sort'] ?? $group->sort,
        ]);

        $this->alert->success('Version group updated.')->flash();

        return redirect()->route('admin.addons.versions.view', $group->id);
    }

    public function destroyGroup(int $group): RedirectResponse
    {
        VersionGroup::query()->findOrFail($group)->delete();

        $this->alert->success('Version group deleted.')->flash();

        return redirect()->route('admin.addons.versions');
    }

    public function storeVersion(Request $request, int $group): RedirectResponse
    {
        $group = $this->downloadGroup($group);
        $data = $request->validate($this->versionRules(), [], $this->attributes());

        $group->versions()->create([
            'name' => $data['name'],
            'download_url' => $data['download_url'],
            'filename' => $data['filename'],
            'extract' => $request->boolean('extract'),
            'sort' => (int) $group->versions()->max('sort') + 1,
        ]);

        $this->alert->success('Version added.')->flash();

        return redirect()->route('admin.addons.versions.view', $group->id);
    }

    public function editVersion(int $group, int $version): View
    {
        $group = $this->downloadGroup($group);

        return view('addons.version-changer.version', [
            'group' => $group,
            'version' => $group->versions()->findOrFail($version),
        ]);
    }

    public function updateVersion(Request $request, int $group, int $version): RedirectResponse
    {
        $group = $this->downloadGroup($group);
        /** @var VersionEntry $version */
        $version = $group->versions()->findOrFail($version);
        $data = $request->validate($this->versionRules(true), [], $this->attributes());

        $version->update([
            'name' => $data['name'],
            'download_url' => $data['download_url'],
            'filename' => $data['filename'],
            'extract' => $request->boolean('extract'),
            'sort' => $data['sort'] ?? $version->sort,
        ]);

        $this->alert->success('Version updated.')->flash();

        return redirect()->route('admin.addons.versions.view', $group->id);
    }

    public function destroyVersion(int $group, int $version): RedirectResponse
    {
        $group = $this->downloadGroup($group);
        $group->versions()->findOrFail($version)->delete();

        $this->alert->success('Version deleted.')->flash();

        return redirect()->route('admin.addons.versions.view', $group->id);
    }

    private function downloadGroup(int $id): VersionGroup
    {
        $group = VersionGroup::query()->findOrFail($id);
        abort_unless($group->isDownload(), 404);

        return $group;
    }

    private function eggs()
    {
        return Egg::query()->with('nest:id,name')->orderBy('nest_id')->orderBy('name')->get(['id', 'nest_id', 'name']);
    }

    private function groupRules(bool $creating): array
    {
        return array_filter([
            'name' => 'required|string|max:191',
            'type' => $creating ? ['required', Rule::in(array_keys(VersionGroup::TYPES))] : null,
            'eggs' => 'required|array|min:1',
            'eggs.*' => 'integer|exists:eggs,id',
            'sort' => $creating ? null : 'nullable|integer|min:0|max:100000',
        ]);
    }

    private function versionRules(bool $updating = false): array
    {
        return array_filter([
            'name' => 'required|string|max:191',
            'download_url' => 'required|string|url:http,https|max:2048',
            // A plain file name in the server's top folder.
            'filename' => ['required', 'string', 'max:191', 'regex:/^(?!\.{1,2}$)[A-Za-z0-9][A-Za-z0-9._ +-]*$/'],
            'extract' => 'sometimes|boolean',
            'sort' => $updating ? 'nullable|integer|min:0|max:100000' : null,
        ]);
    }

    private function attributes(): array
    {
        return [
            'eggs' => 'eggs',
            'eggs.*' => 'egg',
            'download_url' => 'download URL',
            'filename' => 'file name',
        ];
    }
}
