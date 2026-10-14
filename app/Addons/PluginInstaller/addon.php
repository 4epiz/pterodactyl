<?php

/*
 * Plugin Installer: search SpigotMC, Modrinth and Polymart from the client
 * area and install plugins on Minecraft servers in one click. Uses the
 * existing file permissions.
 */
return [
    'name' => 'Plugin Installer',
    'routes' => [
        'client-server' => __DIR__ . '/routes/client.php',
    ],
];
