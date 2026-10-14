@extends('layouts.admin')

@section('title')
    {{ $group->name }} | Server Versions
@endsection

@section('content-header')
    <h1>{{ $group->name }}<small>{{ $types[$group->type] ?? $group->type }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li><a href="{{ route('admin.addons.versions') }}">Server Versions</a></li>
        <li class="active">{{ $group->name }}</li>
    </ol>
@endsection

@section('content')
    <div class="row">
        @if($group->isDownload())
            <div class="col-md-8">
                <div class="box box-primary">
                    <div class="box-header with-border">
                        <h3 class="box-title">Versions</h3>
                    </div>
                    <div class="box-body table-responsive no-padding">
                        <table class="table table-hover">
                            <tbody>
                                <tr>
                                    <th>Name</th>
                                    <th>File</th>
                                    <th>Download link</th>
                                    <th></th>
                                </tr>
                                @forelse($group->versions as $version)
                                    <tr>
                                        <td>{{ $version->name }}</td>
                                        <td>
                                            <code>{{ $version->filename }}</code>
                                            @if($version->extract)
                                                <span class="label label-default">extracted</span>
                                            @endif
                                        </td>
                                        <td style="max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                            <a href="{{ $version->download_url }}" target="_blank" rel="noopener noreferrer" title="{{ $version->download_url }}">{{ $version->download_url }}</a>
                                        </td>
                                        <td class="text-right" style="white-space: nowrap;">
                                            <a href="{{ route('admin.addons.versions.version', [$group->id, $version->id]) }}" class="btn btn-xs btn-primary">Edit</a>
                                            <form action="{{ route('admin.addons.versions.version', [$group->id, $version->id]) }}" method="POST" style="display: inline;" onsubmit="return confirm('Delete {{ addslashes($version->name) }}?');">
                                                {!! csrf_field() !!}
                                                {!! method_field('DELETE') !!}
                                                <button type="submit" class="btn btn-xs btn-danger"><i class="fa fa-trash-o"></i></button>
                                            </form>
                                        </td>
                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="4" class="text-center text-muted" style="padding: 24px;">No versions yet. Add one below.</td>
                                    </tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="box box-success">
                    <div class="box-header with-border">
                        <h3 class="box-title">Add version</h3>
                    </div>
                    <form action="{{ route('admin.addons.versions.store', $group->id) }}" method="POST">
                        {!! csrf_field() !!}
                        @include('addons.version-changer.version-fields', ['version' => null])
                        <div class="box-footer">
                            <button type="submit" class="btn btn-success btn-sm pull-right">Add version</button>
                        </div>
                    </form>
                </div>
            </div>
        @endif
        <div class="{{ $group->isDownload() ? 'col-md-4' : 'col-md-6' }}">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">Group settings</h3>
                </div>
                <form action="{{ route('admin.addons.versions.view', $group->id) }}" method="POST">
                    {!! csrf_field() !!}
                    {!! method_field('PATCH') !!}
                    <div class="box-body">
                        <div class="form-group">
                            <label for="name" class="control-label">Name</label>
                            <input id="name" type="text" name="name" class="form-control" value="{{ old('name', $group->name) }}" maxlength="191">
                        </div>
                        <div class="form-group">
                            <label for="eggs" class="control-label">Eggs</label>
                            @include('addons.version-changer.eggs-select', ['selected' => old('eggs', $group->eggIds())])
                            <p class="text-muted small">
                                @if($group->isDownload())
                                    Servers using one of these eggs can install the versions in this group.
                                @else
                                    Servers using one of these eggs can switch to any of the others.
                                @endif
                            </p>
                        </div>
                        <div class="form-group no-margin-bottom">
                            <label for="sort" class="control-label">Order</label>
                            <input id="sort" type="number" min="0" name="sort" class="form-control" value="{{ old('sort', $group->sort) }}">
                            <p class="text-muted small">Groups with a lower number are shown first.</p>
                        </div>
                    </div>
                    <div class="box-footer">
                        <button type="submit" class="btn btn-primary btn-sm pull-right">Save</button>
                    </div>
                </form>
            </div>
            <div class="box box-danger">
                <div class="box-header with-border">
                    <h3 class="box-title">Delete group</h3>
                </div>
                <div class="box-body">
                    <p class="no-margin-bottom">Removes the group{{ $group->isDownload() ? ' and its versions' : '' }}. Servers keep the files they have.</p>
                </div>
                <form action="{{ route('admin.addons.versions.view', $group->id) }}" method="POST" onsubmit="return confirm('Delete this version group?');">
                    {!! csrf_field() !!}
                    {!! method_field('DELETE') !!}
                    <div class="box-footer">
                        <button type="submit" class="btn btn-danger btn-sm pull-right">Delete group</button>
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
