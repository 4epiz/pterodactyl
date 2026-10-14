# Addons installed on this panel

These addons use the theme's addon loader (`app/Services/Addons/AddonRegistry.php`
and `resources/scripts/addons/index.ts`). They are not part of the Graphite theme
package: `theme-package/build.sh` leaves `app/Addons`, `config/addons`,
`resources/views/addons`, `resources/scripts/addons/*/` and their tests out.

Installed addons are listed under **Admin > Addons**. In the client area,
addon pages appear in their own **Addons** section of a server's sidebar, and
only on servers they apply to: all three addons here are for Minecraft servers.
The game is detected from the egg by the panel (`GameDetector`), and the same
check is applied to the addon's API routes.

If an addon's database tables are missing, the admin area shows a warning and
the addon's pages explain what to do instead of failing.

After adding or updating an addon, run:

```bash
php artisan migrate --force
php artisan optimize:clear
yarn build:production
```

## Version Changer (`VersionChanger`)

Based on Version Changer 1.5, rewritten for Panel 1.11+ and the **stock Wings
daemon** (the original needed a modified Wings build).

- **Admin > Server Versions** (`/admin/addons/versions`): create groups and pick
  which eggs see them.
  - *Download a file*: add versions with a direct download link and the file
    name to save as (usually `server.jar`). Archives can be extracted.
  - *Switch egg*: users can move their server to any egg in the group; the
    server is reinstalled with that egg's install script.
- **Client > Versions** (`/server/<id>/versions`, Minecraft servers only): users pick a version, and
  can choose to delete all files first. The server must be stopped.
- Installing a download removes the `.jar` files in the server's top folder,
  then asks Wings to download the new one (`/files/pull`, waits up to 10
  minutes) and extracts it if needed.
- Permissions: `versions.read`, `versions.install`.
- Not carried over: the "Directory Sync" group types, which read jars from a
  folder on the node and only work with the modified Wings.

## Server Properties (`ServerProperties`)

Based on Minecraft Server Properties 1.0.

- **Client > Properties** (`/server/<id>/properties`, Minecraft servers only):
  edit `server.properties` with switches, number fields and drop-downs.
- Only changed keys are rewritten; comments, order and line endings are kept.
  Values are escaped like Java's `Properties` class, so colour codes such as
  `§a` and values containing `=` or `:` are saved correctly.
- Permissions: `properties.read`, `properties.update`.

## Plugin Installer (`PluginInstaller`)

Based on Plugin Installer 3.2.1.

- **Client > Plugins** (`/server/<id>/plugins`, Minecraft servers only): browse
  and search SpigotMC (through the Spiget API), Modrinth and Polymart, install
  in one click, pick a specific version (Modrinth), update and remove plugins.
- The panel calls the plugin APIs itself, so it no longer depends on the
  original author's proxy servers (`*.fyrehost.net`). Wings downloads the file
  into `/plugins`, named `<Name>-<S|M|P><id>-<version>.jar` like the original,
  so plugins installed with the old addon are recognised.
- Premium SpigotMC plugins, externally hosted plugins and paid Polymart
  plugins link to their page instead (buying through Polymart login is not
  supported).
- Uses the existing file permissions: `file.read` to browse, `file.create` to
  install, `file.delete` to remove.
- Settings: `config/addons/plugin_installer.php` (API addresses, page size,
  cache time). The panel server must be able to reach `api.spiget.org`,
  `api.modrinth.com` and `api.polymart.org`, and Wings must be able to reach
  `cdn.spiget.org`, `cdn.modrinth.com` and Polymart's download host.
