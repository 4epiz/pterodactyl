<?php

/*
 * Server Properties: edit a Minecraft server's server.properties from a form
 * in the client area.
 */
return [
    'name' => 'Server Properties',
    'description' => 'Edit a Minecraft server\'s server.properties from a form.',
    'version' => '1.0',
    // Client area pages, for the admin overview (the pages themselves are in resources/scripts/addons).
    'client_pages' => ['Properties'],
    'permissions' => [
        'properties' => [
            'description' => 'Permissions that control access to the Minecraft server.properties editor.',
            'keys' => [
                'read' => 'Allows a user to view the server properties.',
                'update' => 'Allows a user to change the server properties.',
            ],
        ],
    ],
    'routes' => [
        'client-server' => __DIR__ . '/routes/client.php',
    ],
];
