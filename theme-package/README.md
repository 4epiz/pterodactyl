# Graphite: a theme for Pterodactyl Panel

Graphite is a calm, neutral theme for the Pterodactyl 1.x client area. It includes:

- light and dark themes with a Light / Dark / System switcher (remembered per browser, no flash on load)
- five accent colours to choose from, plus a colour per resource (CPU, memory, disk, network)
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

Users choose an accent (blue, violet, emerald, amber or rose) from the sidebar; it is remembered per browser. The accent colours buttons, switches, focus rings, the active menu item and the brand mark. Each accent is defined near the end of `tailwind.css` as `--accent` (fills), `--accent-fg` (text on fills) and `--accent-text` (accent coloured text and icons), with lighter values for the dark theme. To change the default, edit the `:root, :root[data-accent='blue']` block or add your own `[data-accent='…']` block and list it in `ACCENTS` in `components/theme/ThemeProvider.tsx` and in the inline script in `resources/views/templates/wrapper.blade.php`.

### Resource colours

CPU, memory, disk, network and uptime each have their own colour (`--c-cpu`, `--c-memory`, `--c-disk`, `--c-net-in`, `--c-net-out`, `--c-uptime`), used consistently by the console stats, usage bars and charts. Bars still turn amber above 80% and red above 90% usage.

After editing, rebuild with `yarn build:production`.

## Updating the panel

Panel updates replace the panel's source files, which removes the theme. After updating, either:

- run `./install.sh reapply` with the Graphite version that supports the new panel release, or
- run `./install.sh uninstall` before updating, then `./install.sh install` afterwards.

## Credits

- Fonts: [Geist and Geist Mono](https://vercel.com/font) (SIL Open Font License 1.1)
- Icons: [Heroicons](https://heroicons.com) (MIT)

Pterodactyl® is a registered trademark of its respective owner. Graphite is an independent theme and is not affiliated with or endorsed by the Pterodactyl project.
