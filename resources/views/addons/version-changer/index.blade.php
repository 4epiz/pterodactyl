@extends('layouts.admin')

@section('title')
    Server Versions
@endsection

@section('content-header')
    <h1>Server Versions<small>Versions users can switch their servers to from the client area.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Server Versions</li>
    </ol>
@endsection

@section('content')
    <div class="row">
        <div class="col-md-8">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">Version groups</h3>
                </div>
                <div class="box-body table-responsive no-padding">
                    <table class="table table-hover">
                        <tbody>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Available to</th>
                                <th class="text-center">Versions</th>
                                <th></th>
                            </tr>
                            @forelse($groups as $group)
                                @php($groupEggs = $eggs->whereIn('id', $group->eggIds()))
                                <tr>
                                    <td><a href="{{ route('admin.addons.versions.view', $group->id) }}">{{ $group->name }}</a></td>
                                    <td>
                                        @if($group->isDownload())
                                            <span class="label label-primary">Download</span>
                                        @else
                                            <span class="label label-info">Switch egg</span>
                                        @endif
                                    </td>
                                    <td>
                                        @foreach($groupEggs->take(3) as $egg)
                                            <code>{{ $egg->name }}</code>
                                        @endforeach
                                        @if($groupEggs->count() > 3)
                                            <span class="text-muted">+{{ $groupEggs->count() - 3 }} more</span>
                                        @endif
                                    </td>
                                    <td class="text-center">{{ $group->isDownload() ? $group->versions_count : $groupEggs->count() }}</td>
                                    <td class="text-right">
                                        <a href="{{ route('admin.addons.versions.view', $group->id) }}" class="btn btn-xs btn-primary">
                                            {{ $group->isDownload() ? 'Manage versions' : 'Edit' }}
                                        </a>
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="5" class="text-center text-muted" style="padding: 24px;">No version groups yet. Create one to get started.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="box box-default">
                <div class="box-header with-border">
                    <h3 class="box-title">How it works</h3>
                </div>
                <div class="box-body">
                    <p><strong>Download a file</strong>: you add versions with a download link, for example the Paper or Vanilla server jar for each Minecraft version. When a user picks one, the panel asks Wings to download it into the server's folder under the file name you set (usually <code>server.jar</code>), replacing the <code>.jar</code> files in the server's top folder. Archives can be extracted automatically.</p>
                    <p class="no-margin-bottom"><strong>Switch egg</strong>: users can move their server to any egg in the group, for example from Paper to Forge. The server is reinstalled with the new egg's install script; its files are kept unless the user chooses to delete them.</p>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="box box-success">
                <div class="box-header with-border">
                    <h3 class="box-title">Create group</h3>
                </div>
                <form action="{{ route('admin.addons.versions') }}" method="POST">
                    {!! csrf_field() !!}
                    <div class="box-body">
                        <div class="form-group">
                            <label for="name" class="control-label">Name</label>
                            <input id="name" type="text" name="name" class="form-control" value="{{ old('name') }}" placeholder="Paper" maxlength="191">
                            <p class="text-muted small">Shown to users as the heading of the group.</p>
                        </div>
                        <div class="form-group">
                            <label for="type" class="control-label">Type</label>
                            <select id="type" name="type" class="form-control">
                                @foreach($types as $type => $label)
                                    <option value="{{ $type }}" @selected(old('type') === $type)>{{ $label }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div class="form-group no-margin-bottom">
                            <label for="eggs" class="control-label">Eggs</label>
                            @include('addons.version-changer.eggs-select', ['selected' => old('eggs', [])])
                            <p class="text-muted small">Servers using one of these eggs see the group. For "Switch egg" groups these are also the eggs users can switch between.</p>
                        </div>
                    </div>
                    <div class="box-footer">
                        <button type="submit" class="btn btn-success btn-sm pull-right">Create</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
@endsection

@section('footer-scripts')
    @parent
    <script>
        $('.vc-eggs').select2({ placeholder: 'Select eggs', width: '100%' });
    </script>
@endsection
