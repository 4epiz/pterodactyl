@extends('layouts.admin')

@section('title')
    Addons
@endsection

@section('content-header')
    <h1>Addons<small>Extensions installed on this panel.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Addons</li>
    </ol>
@endsection

@section('content')
    <div class="row">
        <div class="col-xs-12">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">Installed addons</h3>
                </div>
                <div class="box-body table-responsive no-padding">
                    <table class="table table-hover">
                        <tbody>
                            <tr>
                                <th>Addon</th>
                                <th>Client area</th>
                                <th>Subuser permissions</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                            @forelse($addons as $addon)
                                <tr>
                                    <td style="max-width: 420px;">
                                        <strong>{{ $addon['name'] }}</strong>
                                        @if($addon['version'])
                                            <span class="text-muted small">v{{ $addon['version'] }}</span>
                                        @endif
                                        @if($addon['description'])
                                            <p class="text-muted small no-margin">{{ $addon['description'] }}</p>
                                        @endif
                                    </td>
                                    <td>
                                        @forelse($addon['client_pages'] as $page)
                                            <span class="label label-default">{{ $page }}</span>
                                        @empty
                                            <span class="text-muted">-</span>
                                        @endforelse
                                    </td>
                                    <td>
                                        @forelse($addon['permissions'] as $permission)
                                            <code>{{ $permission }}.*</code>
                                        @empty
                                            <span class="text-muted">Uses existing permissions</span>
                                        @endforelse
                                    </td>
                                    <td>
                                        @if(count($addon['pending']) > 0)
                                            <span class="label label-warning">Needs <code>php artisan migrate</code></span>
                                        @else
                                            <span class="label label-success">Ready</span>
                                        @endif
                                    </td>
                                    <td class="text-right">
                                        @if($addon['admin_nav'])
                                            <a href="{{ route($addon['admin_nav']['route']) }}" class="btn btn-xs btn-primary">Manage</a>
                                        @endif
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="5" class="text-center text-muted" style="padding: 24px;">No addons are installed.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
                <div class="box-footer">
                    <p class="text-muted small no-margin">
                        Addons live in <code>app/Addons</code> and <code>resources/scripts/addons</code>. After adding, updating or removing one, run
                        <code>php artisan migrate --force</code>, <code>php artisan optimize:clear</code> and <code>yarn build:production</code>.
                    </p>
                </div>
            </div>
        </div>
    </div>
@endsection
