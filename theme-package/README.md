# Graphite: a theme for Pterodactyl Panel

Graphite is a calm, neutral theme for the Pterodactyl 1.x client area. It includes:

- light and dark themes with a Light / Dark / System switcher (remembered per browser, no flash on load)
- floating sidebar and top bar, with the Pterodactyl logo
- per-game artwork on server cards and the console page, picked automatically from each server's egg
- a lime accent by default, with mono, blue, violet, emerald, amber and rose to choose from in the account menu
- an **Admin > Theme** page to set the accent, announcements, branding, sidebar links and game artwork without editing code
- a custom code editor that opens files in a floating window over the file manager (drag, maximize, Ctrl+S to save, unsaved-changes warning)
- a sidebar layout that works on desktop and mobile
- a redesigned dashboard, console and sign-in pages
- smooth, restrained motion via Framer Motion

This is the **standalone edition**: it installs by updating the panel's source files and rebuilding the frontend.

## Requirements

- Pterodactyl Panel 1.11.x or 1.12.x
- Node.js 22+ and Yarn 1.x (the same tools needed to build the panel)
- `git` (used to merge changes when files have been modified by addons)
- About 4 GB of free memory while the frontend builds

## Install

```bash
cd /tmp
unzip graphite-theme-<version>.zip
cd graphite-theme-<version>
sudo ./install.sh install --panel /var/www/pterodactyl
```

The installer:

1. checks your panel version, and warns if Blueprint is installed (use the Blueprint edition in that case)
2. backs up every file it touches to `/var/www/pterodactyl/.graphite-theme/`
3. copies the theme files, merging into any file an addon has already modified
4. adds the Geist font packages with Yarn
5. runs `yarn build:production` and clears the view cache

Hard-refresh your browser afterwards.

Add `--no-build` to skip step 5 when you want to install other addons first and build once at the end.

## Admin > Theme

After installing, a **Theme** page appears in the admin area sidebar (`/admin/theme`). Changes apply the next time a page is loaded; no rebuild is needed.

| Section | Settings |
|---|---|
| Announcement | A banner shown at the top of every client-area page: style (info, success, warning, danger), title, message, an optional link, and whether users can dismiss it. Editing the announcement shows it again to users who dismissed it. |
| Appearance | The default accent colour, whether users may pick their own, the default theme (light, dark or follow the device), whether users may switch it, and the dashboard greeting and featured server. |
| Branding | Logo URL, the subtitle under the panel name, the sign-in heading and text, and footer text shown next to the Pterodactyl credit. The panel name itself is still set under Admin > Settings. |
| Sidebar links | Billing, support, status page and Discord links. Filled-in links appear in the client sidebar and open in a new tab. |
| Game artwork | An image URL per game, replacing the built-in illustration for that game. |

Settings are stored as one row (`settings::theme:config`) in the panel's `settings` table, so they survive panel updates and theme reinstalls. Links and image URLs must start with `http://`, `https://` or `/`.

## Uninstall

```bash
sudo ./install.sh uninstall --panel /var/www/pterodactyl
```

This restores every original file from the backup, removes files the theme added, and rebuilds the panel.

## Addons

Graphite is designed to coexist with addons that add pages to the panel:

- **Sidebar entries come from `resources/scripts/routers/routes.ts`.** Any page an addon registers there shows up in the sidebar automatically, with its permission check intact. Graphite does not modify `routes.ts`.
- **Unknown pages get a generic icon.** To give an addon its own icon, add its route path to `resources/scripts/components/theme/navIcons.ts`.
- **Shared components keep their names and props.** `ServerContentBlock`, `PageContentBlock`, `TitledGreyBox`, `Button`, `Input`, `Dialog` and the rest are restyled in place, so addon pages built from them match the theme.
- **Colours are CSS variables.** Addons that use the panel's Tailwind colours (`bg-neutral-700`, `text-gray-200`, ...) follow the light and dark themes automatically.

### Addon folders

Graphite also adds a small loader so addons can be installed without editing the panel's own files. An addon made for it is a set of folders:

| Folder | Contents |
|---|---|
| `app/Addons/<Name>/` | PHP code and an `addon.php` manifest: subuser permissions, route files, migrations and an admin sidebar link |
| `resources/scripts/addons/<name>/index.ts` | client-area pages, picked up automatically when the panel is built |
| `resources/views/addons/<name>/` | admin area pages |
| `config/addons/<name>.php` | settings, available as `config('addons.<name>')` |

Addon pages get their own **Addons** section in the server sidebar, and **Admin > Addons** lists every installed addon and whether it still needs `php artisan migrate`. Client pages can be limited to certain games, nests or eggs (`games: ['minecraft']`, `nestIds`, `eggIds`), and server routes can use the `RequireGame` middleware to match. Games are detected with the same rules in the browser and on the server (`resources/scripts/components/theme/gameRules.json`). See `app/Services/Addons/AddonRegistry.php` and `resources/scripts/addons/index.ts` for the manifest format. After copying an addon in, run `php artisan migrate`, `php artisan optimize:clear` and `yarn build:production`.

### Installing an addon after Graphite

If an addon's installer overwrites a file Graphite changed, run:

```bash
sudo ./install.sh reapply --panel /var/www/pterodactyl
```

This merges Graphite's changes back on top of the addon's version.

Note that `uninstall` restores files as they were *before Graphite was installed*. Re-run your addon's installer after uninstalling the theme if it changed the same files later.

### Merge conflicts

If both an addon and Graphite change the same lines, the installer leaves the file untouched and writes a `<file>.theme-conflict` copy next to it with standard conflict markers. Check for these with:

```bash
./install.sh status --panel /var/www/pterodactyl
```

Resolve the conflict, or send the `.theme-conflict` file to support, then run `reapply`.

## Customising

All colours live in `resources/scripts/assets/tailwind.css` as space-separated RGB values, once for `[data-theme='dark']` and once for `[data-theme='light']`:

| Token | Used for |
|---|---|
| `--app` | page background |
| `--surface`, `--surface-2`, `--surface-3` | cards, raised areas, hover states |
| `--line`, `--line-strong` | borders and dividers |
| `--fg`, `--fg-muted`, `--fg-subtle` | text, from strongest to quietest |
| `--ink`, `--ink-fg` | primary buttons and accents, and the text on them |
| `--term-*` | the console, which stays dark in both themes |

### Accent colours

The accent is lime by default; change it under Admin > Theme. Unless that page disables it, users can pick mono (black in light mode, white in dark mode), blue, violet, emerald, amber or rose from the account menu at the bottom of the sidebar; the choice is remembered per browser. Each accent is defined near the end of `tailwind.css` as `--accent` (fills), `--accent-fg` (text on fills) and `--accent-text` (accent coloured text), with separate values for the dark theme. To add one, add a `[data-accent='…']` block there, add it to `ACCENTS` in `components/theme/ThemeProvider.tsx`, to the inline script in `resources/views/templates/wrapper.blade.php` and to `ACCENTS` in `app/Services/Theme/ThemeSettingsService.php` (plus a swatch colour in `resources/views/admin/theme/index.blade.php`).

### Game artwork

Server cards, the console header and the sidebar show artwork for the server's game. The game is detected from the egg name first, then from the docker image, startup command and variable names (`components/theme/games.ts`). Supported out of the box: Minecraft (Paper, Forge, Fabric, Velocity, Bedrock, ...), FiveM, RedM, Rust, ARK, Valheim, Terraria, Source games (CS2, Garry's Mod, TF2, ...), survival games (Project Zomboid, 7 Days to Die, DayZ, ...), voice servers, databases and bots/applications. Anything else gets a neutral illustration.

The illustrations are original artwork drawn for this theme. They evoke each genre without using any game's copyrighted or trademarked art, which is what lets the theme be sold.

To use your own images instead, for example official artwork you have permission to use, enter their URLs under **Admin > Theme > Game artwork**. Images placed in the panel's `public` folder can be referenced as `/themes/graphite/games/minecraft.jpg`.

Alternatively, bake them into the build:

1. Put the image in the panel's `public` folder, e.g. `public/themes/graphite/games/minecraft.jpg`. A wide image of about 1200×600 works best.
2. Map the game to it in `customGameImages` in `resources/scripts/components/theme/games.ts`:
   ```ts
   export const customGameImages: Partial<Record<GameKey, string>> = {
       minecraft: '/themes/graphite/games/minecraft.jpg',
   };
   ```
3. Rebuild with `yarn build:production`.

To recognise an egg that isn't detected, add its name to the matching pattern in the `rules` list in the same file.

## Updating the panel

Panel updates replace the panel's source files, which removes the theme. After updating, either:

- run `./install.sh reapply` with the Graphite version that supports the new panel release, or
- run `./install.sh uninstall` before updating, then `./install.sh install` afterwards.

## Credits

- Fonts: [Geist and Geist Mono](https://vercel.com/font) (SIL Open Font License 1.1)
- Icons: [Heroicons](https://heroicons.com) (MIT)

Pterodactyl® is a registered trademark of its respective owner. Graphite is an independent theme and is not affiliated with or endorsed by the Pterodactyl project.
