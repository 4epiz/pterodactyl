<?php

/*
 * Version Changer: lets users switch their server to another version picked
 * by an administrator, either by downloading a server jar or by switching to
 * another egg. Works with the stock Wings daemon.
 */
return [
    'name' => 'Version Changer',
    'description' => 'Lets users switch their Minecraft server to versions you set up, by downloading a server jar or switching egg.',
    'version' => '1.5',
    // Client area pages, for the admin overview (the pages themselves are in resources/scripts/addons).
    'client_pages' => ['Versions'],
    'permissions' => [
        'versions' => [
            'description' => 'Permissions that control access to the version changer.',
            'keys' => [
                'read' => 'Allows a user to view the versions available for the server.',
                'install' => 'Allows a user to install another version, which replaces the server jar or reinstalls the server.',
            ],
        ],
    ],
    'routes' => [
        'admin' => __DIR__ . '/routes/admin.php',
        'client-server' => __DIR__ . '/routes/client.php',
    ],
    'migrations' => __DIR__ . '/Migrations',
    'admin_nav' => [
        'route' => 'admin.addons.versions',
        'label' => 'Server Versions',
        'icon' => 'fa-code-fork',
    ],
];
