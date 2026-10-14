<?php

/*
 * Plugin Installer: search SpigotMC, Modrinth and Polymart from the client
 * area and install plugins on Minecraft servers in one click. Uses the
 * existing file permissions.
 */
return [
    'name' => 'Plugin Installer',
    'description' => 'Search SpigotMC, Modrinth and Polymart and install plugins on Minecraft servers in one click.',
    'version' => '3.2.1',
    // Client area pages, for the admin overview (the pages themselves are in resources/scripts/addons).
    'client_pages' => ['Plugins'],
    'routes' => [
        'client-server' => __DIR__ . '/routes/client.php',
    ],
];
