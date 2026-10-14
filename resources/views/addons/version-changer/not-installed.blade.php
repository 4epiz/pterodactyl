@extends('layouts.admin')

@section('title')
    Server Versions
@endsection

@section('content-header')
    <h1>Server Versions<small>Setup needed</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Server Versions</li>
    </ol>
@endsection

@section('content')
    <div class="row">
        <div class="col-md-8">
            <div class="box box-warning">
                <div class="box-header with-border">
                    <h3 class="box-title">Finish installing the version changer</h3>
                </div>
                <div class="box-body">
                    <p>The version changer's database tables do not exist yet. Run this on the panel server, in the panel folder:</p>
                    <pre>cd /var/www/pterodactyl
php artisan migrate --force
php artisan optimize:clear</pre>
                    <p class="no-margin-bottom">Then reload this page.</p>
                </div>
            </div>
        </div>
    </div>
@endsection
