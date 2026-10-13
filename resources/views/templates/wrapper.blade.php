<!DOCTYPE html>
<html data-theme="dark">
    <head>
        <script>
            (function () {
                // Applies the light/dark theme and accent before the first paint to avoid a flash.
                // Defaults and locks come from Admin > Theme. Keep the storage keys and logic in
                // sync with components/theme/ThemeProvider.tsx.
                var cfg = @json(data_get($siteConfiguration ?? [], 'theme.appearance')) || {};
                var mode = cfg.default_mode || 'system';
                var accent = cfg.accent || 'lime';
                try {
                    if (cfg.allow_mode_change !== false) mode = localStorage.getItem('panel:theme') || mode;
                    if (cfg.allow_accent_change !== false) accent = localStorage.getItem('panel:accent') || accent;
                } catch (e) {}
                if (mode !== 'light' && mode !== 'dark') {
                    mode = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
                }
                document.documentElement.setAttribute('data-theme', mode);
                if (/^(lime|mono|blue|violet|emerald|amber|rose)$/.test(accent)) {
                    document.documentElement.setAttribute('data-accent', accent);
                }
            })();
        </script>
        <title>{{ config('app.name', 'Pterodactyl') }}</title>

        @section('meta')
            <meta charset="utf-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">
            <meta name="csrf-token" content="{{ csrf_token() }}">
            <meta name="robots" content="noindex">
            <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png">
            <link rel="icon" type="image/png" href="/favicons/favicon-32x32.png" sizes="32x32">
            <link rel="icon" type="image/png" href="/favicons/favicon-16x16.png" sizes="16x16">
            <link rel="manifest" href="/favicons/manifest.json">
            <link rel="mask-icon" href="/favicons/safari-pinned-tab.svg" color="#bc6e3c">
            <link rel="shortcut icon" href="/favicons/favicon.ico">
            <meta name="msapplication-config" content="/favicons/browserconfig.xml">
            <meta name="theme-color" content="#0c0c0d">
        @show

        @section('user-data')
            @if(!is_null(Auth::user()))
                <script>
                    window.PterodactylUser = {!! json_encode(Auth::user()->toVueObject()) !!};
                </script>
            @endif
            @if(!empty($siteConfiguration))
                <script>
                    window.SiteConfiguration = {!! json_encode($siteConfiguration) !!};
                </script>
            @endif
        @show

        @yield('assets')

        @include('layouts.scripts')
    </head>
    <body class="{{ $css['body'] ?? 'bg-app' }}">
        @section('content')
            @yield('above-container')
            @yield('container')
            @yield('below-container')
        @show
        @section('scripts')
            {!! $asset->js('main.js') !!}
        @show
    </body>
</html>
