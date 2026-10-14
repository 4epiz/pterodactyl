<?php

/*
 * Settings for the Plugin Installer addon (app/Addons/PluginInstaller).
 * Available as config('addons.plugin_installer').
 */
return [
    // APIs the panel searches. Override them if you run a mirror or cache.
    'spiget_url' => env('PLUGIN_INSTALLER_SPIGET_URL', 'https://api.spiget.org/v2'),
    // Spiget's copy of free SpigotMC plugin files. Wings downloads from here.
    'spiget_cdn_url' => env('PLUGIN_INSTALLER_SPIGET_CDN_URL', 'https://cdn.spiget.org/file/spiget-resources'),
    'modrinth_url' => env('PLUGIN_INSTALLER_MODRINTH_URL', 'https://api.modrinth.com/v2'),
    'polymart_url' => env('PLUGIN_INSTALLER_POLYMART_URL', 'https://api.polymart.org/v1'),

    // Referral code sent with Polymart searches, kept from the original addon.
    'polymart_referral' => env('PLUGIN_INSTALLER_POLYMART_REFERRAL', '13204'),

    // Results per page.
    'per_page' => 18,

    // How long search results are cached, in seconds.
    'cache_ttl' => 300,

    // Timeout for requests to the plugin APIs, in seconds.
    'timeout' => 10,
];
