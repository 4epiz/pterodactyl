@extends('layouts.admin')

@section('title')
    {{ $version->name }} | {{ $group->name }}
@endsection

@section('content-header')
    <h1>{{ $version->name }}<small>{{ $group->name }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li><a href="{{ route('admin.addons.versions') }}">Server Versions</a></li>
        <li><a href="{{ route('admin.addons.versions.view', $group->id) }}">{{ $group->name }}</a></li>
        <li class="active">{{ $version->name }}</li>
    </ol>
@endsection

@section('content')
    <div class="row">
        <div class="col-md-8">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">Edit version</h3>
                </div>
                <form action="{{ route('admin.addons.versions.version', [$group->id, $version->id]) }}" method="POST">
                    {!! csrf_field() !!}
                    {!! method_field('PATCH') !!}
                    @include('addons.version-changer.version-fields', ['version' => $version])
                    <div class="box-footer">
                        <a href="{{ route('admin.addons.versions.view', $group->id) }}" class="btn btn-default btn-sm">Back</a>
                        <button type="submit" class="btn btn-primary btn-sm pull-right">Save</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
@endsection
