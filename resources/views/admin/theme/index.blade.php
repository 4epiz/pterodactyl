@extends('layouts.admin')

@section('title')
    Theme
@endsection

@section('content-header')
    <h1>Theme<small>Branding, appearance, announcements and links for the client area.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Theme</li>
    </ol>
@endsection

@php
    $value = fn (string $key) => old($key, data_get($theme, $key));
    $checked = fn (string $key) => (bool) old($key, data_get($theme, $key));
    $swatches = [
        'lime' => '#c4ee26', 'mono' => 'linear-gradient(135deg, #18181b 50%, #e4e4e7 50%)', 'blue' => '#2563eb',
        'violet' => '#7c3aed', 'emerald' => '#059669', 'amber' => '#f59e0b', 'rose' => '#e11d48',
    ];
@endphp

@section('content')
    <form action="{{ route('admin.theme') }}" method="POST">
        {!! csrf_field() !!}
        {!! method_field('PATCH') !!}

        <div class="row">
            {{-- Announcement --}}
            <div class="col-md-6">
                <div class="box box-primary">
                    <div class="box-header with-border">
                        <h3 class="box-title">Announcement</h3>
                    </div>
                    <div class="box-body">
                        <div class="form-group">
                            <input type="hidden" name="announcement[enabled]" value="0">
                            <div class="checkbox checkbox-primary no-margin-bottom">
                                <input id="announcement_enabled" type="checkbox" name="announcement[enabled]" value="1" @checked($checked('announcement.enabled'))>
                                <label for="announcement_enabled" class="strong">Show an announcement to all users</label>
                            </div>
                            <p class="text-muted small">Shown as a banner at the top of every page in the client area.</p>
                        </div>
                        <div class="row">
                            <div class="form-group col-sm-4">
                                <label class="control-label" for="announcement_type">Style</label>
                                <select id="announcement_type" name="announcement[type]" class="form-control">
                                    @foreach($announcementTypes as $type)
                                        <option value="{{ $type }}" @selected($value('announcement.type') === $type)>{{ ucfirst($type) }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="form-group col-sm-8">
                                <label class="control-label" for="announcement_title">Title <span class="field-optional"></span></label>
                                <input id="announcement_title" type="text" class="form-control" name="announcement[title]" maxlength="80" value="{{ $value('announcement.title') }}" placeholder="Scheduled maintenance">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="control-label" for="announcement_message">Message</label>
                            <textarea id="announcement_message" class="form-control" name="announcement[message]" rows="3" maxlength="500" placeholder="Nodes in Frankfurt will restart on Sunday at 04:00 UTC.">{{ $value('announcement.message') }}</textarea>
                        </div>
                        <div class="row">
                            <div class="form-group col-sm-8">
                                <label class="control-label" for="announcement_link_url">Link <span class="field-optional"></span></label>
                                <input id="announcement_link_url" type="text" class="form-control" name="announcement[link_url]" value="{{ $value('announcement.link_url') }}" placeholder="https://status.example.com">
                            </div>
                            <div class="form-group col-sm-4">
                                <label class="control-label" for="announcement_link_label">Link text</label>
                                <input id="announcement_link_label" type="text" class="form-control" name="announcement[link_label]" maxlength="40" value="{{ $value('announcement.link_label') }}" placeholder="Learn more">
                            </div>
                        </div>
                        <div class="form-group no-margin-bottom">
                            <input type="hidden" name="announcement[dismissible]" value="0">
                            <div class="checkbox checkbox-primary no-margin-bottom">
                                <input id="announcement_dismissible" type="checkbox" name="announcement[dismissible]" value="1" @checked($checked('announcement.dismissible'))>
                                <label for="announcement_dismissible">Users can dismiss it</label>
                            </div>
                            <p class="text-muted small">Editing the announcement shows it again to users who dismissed it.</p>
                        </div>
                    </div>
                </div>
            </div>

            {{-- Appearance --}}
            <div class="col-md-6">
                <div class="box box-primary">
                    <div class="box-header with-border">
                        <h3 class="box-title">Appearance</h3>
                    </div>
                    <div class="box-body">
                        <div class="form-group">
                            <label class="control-label">Accent colour</label>
                            <div class="theme-swatches">
                                @foreach($accents as $accent)
                                    <label class="theme-swatch" title="{{ ucfirst($accent) }}">
                                        <input type="radio" name="appearance[accent]" value="{{ $accent }}" @checked($value('appearance.accent') === $accent)>
                                        <span style="background: {{ $swatches[$accent] }}"></span>
                                        <small>{{ ucfirst($accent) }}</small>
                                    </label>
                                @endforeach
                            </div>
                        </div>
                        <div class="form-group">
                            <input type="hidden" name="appearance[allow_accent_change]" value="0">
                            <div class="checkbox checkbox-primary no-margin-bottom">
                                <input id="allow_accent_change" type="checkbox" name="appearance[allow_accent_change]" value="1" @checked($checked('appearance.allow_accent_change'))>
                                <label for="allow_accent_change">Let users pick their own accent</label>
                            </div>
                            <p class="text-muted small">When off, everyone sees the accent above.</p>
                        </div>
                        <div class="form-group">
                            <label class="control-label" for="default_mode">Default theme</label>
                            <select id="default_mode" name="appearance[default_mode]" class="form-control">
                                @foreach($modes as $mode)
                                    <option value="{{ $mode }}" @selected($value('appearance.default_mode') === $mode)>{{ $mode === 'system' ? 'Follow the user\'s device' : ucfirst($mode) }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div class="form-group">
                            <input type="hidden" name="appearance[allow_mode_change]" value="0">
                            <div class="checkbox checkbox-primary no-margin-bottom">
                                <input id="allow_mode_change" type="checkbox" name="appearance[allow_mode_change]" value="1" @checked($checked('appearance.allow_mode_change'))>
                                <label for="allow_mode_change">Let users switch between light and dark</label>
                            </div>
                        </div>
                        <hr>
                        <div class="form-group">
                            <input type="hidden" name="appearance[show_greeting]" value="0">
                            <div class="checkbox checkbox-primary no-margin-bottom">
                                <input id="show_greeting" type="checkbox" name="appearance[show_greeting]" value="1" @checked($checked('appearance.show_greeting'))>
                                <label for="show_greeting">Greet users by name on the dashboard</label>
                            </div>
                        </div>
                        <div class="form-group no-margin-bottom">
                            <input type="hidden" name="appearance[show_featured]" value="0">
                            <div class="checkbox checkbox-primary no-margin-bottom">
                                <input id="show_featured" type="checkbox" name="appearance[show_featured]" value="1" @checked($checked('appearance.show_featured'))>
                                <label for="show_featured">Feature the busiest server at the top of the dashboard</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            {{-- Branding --}}
            <div class="col-md-6">
                <div class="box">
                    <div class="box-header with-border">
                        <h3 class="box-title">Branding</h3>
                    </div>
                    <div class="box-body">
                        <p class="text-muted small">The panel name is set under <a href="{{ route('admin.settings') }}">Settings</a>.</p>
                        <div class="row">
                            <div class="form-group col-sm-6">
                                <label class="control-label" for="logo_url">Logo URL <span class="field-optional"></span></label>
                                <input id="logo_url" type="text" class="form-control" name="branding[logo_url]" value="{{ $value('branding.logo_url') }}" placeholder="/assets/svgs/pterodactyl.svg">
                                <p class="text-muted small">A square image works best. Leave empty for the Pterodactyl logo.</p>
                            </div>
                            <div class="form-group col-sm-6">
                                <label class="control-label" for="subtitle">Subtitle under the name</label>
                                <input id="subtitle" type="text" class="form-control" name="branding[subtitle]" maxlength="60" value="{{ $value('branding.subtitle') }}" placeholder="Control panel">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="control-label" for="login_title">Sign-in heading</label>
                            <input id="login_title" type="text" class="form-control" name="branding[login_title]" maxlength="80" value="{{ $value('branding.login_title') }}">
                        </div>
                        <div class="form-group">
                            <label class="control-label" for="login_subtitle">Sign-in text</label>
                            <input id="login_subtitle" type="text" class="form-control" name="branding[login_subtitle]" maxlength="200" value="{{ $value('branding.login_subtitle') }}">
                        </div>
                        <div class="form-group no-margin-bottom">
                            <label class="control-label" for="footer_text">Footer text <span class="field-optional"></span></label>
                            <input id="footer_text" type="text" class="form-control" name="branding[footer_text]" maxlength="200" value="{{ $value('branding.footer_text') }}" placeholder="© Example Hosting Ltd.">
                            <p class="text-muted small">Shown next to the Pterodactyl credit at the bottom of each page.</p>
                        </div>
                    </div>
                </div>
            </div>

            {{-- Links --}}
            <div class="col-md-6">
                <div class="box">
                    <div class="box-header with-border">
                        <h3 class="box-title">Sidebar links</h3>
                    </div>
                    <div class="box-body">
                        <p class="text-muted small">Filled-in links appear in the client area sidebar and open in a new tab.</p>
                        @foreach(['billing_url' => ['Billing', 'https://billing.example.com'], 'support_url' => ['Support', 'https://example.com/support'], 'status_url' => ['Status page', 'https://status.example.com'], 'discord_url' => ['Discord', 'https://discord.gg/example']] as $key => [$label, $placeholder])
                            <div class="form-group @if($loop->last) no-margin-bottom @endif">
                                <label class="control-label" for="{{ $key }}">{{ $label }} <span class="field-optional"></span></label>
                                <input id="{{ $key }}" type="text" class="form-control" name="links[{{ $key }}]" value="{{ $value('links.' . $key) }}" placeholder="{{ $placeholder }}">
                            </div>
                        @endforeach
                    </div>
                </div>
            </div>
        </div>

        {{-- Game images --}}
        <div class="row">
            <div class="col-xs-12">
                <div class="box">
                    <div class="box-header with-border">
                        <h3 class="box-title">Game artwork</h3>
                    </div>
                    <div class="box-body">
                        <p class="text-muted small">
                            Server cards and console headers show artwork for each server's game, detected from its egg.
                            Leave a field empty to use the built-in illustration, or enter the URL of an image you have the
                            rights to use (wide images around 1200&times;600 work best; files placed in the panel's
                            <code>public</code> folder can be referenced as <code>/path/to/image.jpg</code>).
                        </p>
                        <div class="row">
                            @foreach($games as $game => $label)
                                <div class="form-group col-sm-6 col-md-4">
                                    <label class="control-label" for="game_{{ $game }}">{{ $label }}</label>
                                    <input id="game_{{ $game }}" type="text" class="form-control" name="game_images[{{ $game }}]" value="{{ $value('game_images.' . $game) }}" placeholder="Built-in artwork">
                                </div>
                            @endforeach
                        </div>
                    </div>
                    <div class="box-footer">
                        <button type="submit" class="btn btn-sm btn-primary pull-right">Save theme settings</button>
                    </div>
                </div>
            </div>
        </div>
    </form>
@endsection

@section('footer-scripts')
    @parent
    <style>
        .theme-swatches { display: flex; flex-wrap: wrap; gap: 14px; }
        .theme-swatch { display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; font-weight: normal; margin: 0; }
        .theme-swatch input { position: absolute; opacity: 0; pointer-events: none; }
        .theme-swatch span { width: 30px; height: 30px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .15); transition: box-shadow .15s; }
        .theme-swatch input:checked + span { box-shadow: 0 0 0 2px #fff, 0 0 0 4px #3c8dbc; }
        .theme-swatch input:focus-visible + span { box-shadow: 0 0 0 2px #fff, 0 0 0 4px #3c8dbc; }
        .theme-swatch small { color: #777; }
    </style>
@endsection
