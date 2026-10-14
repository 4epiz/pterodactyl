#!/usr/bin/env bash
#
# Graphite theme for Pterodactyl Panel 1.x: standalone installer.
#
#   ./install.sh install   [--panel /var/www/pterodactyl] [--force] [--no-build]
#   ./install.sh uninstall [--panel /var/www/pterodactyl] [--no-build]
#   ./install.sh reapply   [--panel /var/www/pterodactyl] [--no-build]
#   ./install.sh status    [--panel /var/www/pterodactyl]
#
# Files you or an addon have changed are three-way merged with the theme instead
# of being overwritten. If a merge cannot be done automatically the file is left
# untouched and a "<file>.theme-conflict" copy with conflict markers is written
# next to it. Every file touched is backed up first so "uninstall" restores the
# panel exactly as it was.
set -euo pipefail

PKG="$(cd "$(dirname "$0")" && pwd)"
PANEL="/var/www/pterodactyl"
FORCE=0
BUILD=1
ACTION="${1:-}"
shift || true

while [[ $# -gt 0 ]]; do
    case "$1" in
        --panel) PANEL="$2"; shift 2 ;;
        --force) FORCE=1; shift ;;
        --no-build) BUILD=0; shift ;;
        *) echo "Unknown option: $1" >&2; exit 1 ;;
    esac
done

if [[ ! -f "$PKG/MANIFEST" && -n "$ACTION" ]]; then
    echo "This is the installer source, not a built theme package." >&2
    echo "Run theme-package/build.sh, unzip theme-package/dist/graphite-theme-<version>.zip" >&2
    echo "outside the panel directory, and run ./install.sh from the unzipped folder." >&2
    exit 1
fi

STATE="$PANEL/.graphite-theme"
THEME_VERSION="$(cat "$PKG/VERSION" 2>/dev/null || echo dev)"
SUPPORTED_RE='^(1\.11\.|1\.12\.|canary$)'

bold() { printf '\033[1m%s\033[0m\n' "$*"; }
info() { printf '  %s\n' "$*"; }
warn() { printf '\033[33m  ! %s\033[0m\n' "$*"; }
fail() { printf '\033[31m  x %s\033[0m\n' "$*" >&2; exit 1; }

require() { command -v "$1" > /dev/null 2>&1 || fail "'$1' is required but was not found in PATH."; }

panel_version() {
    sed -n "s/.*'version' => '\([^']*\)'.*/\1/p" "$PANEL/config/app.php" | head -n1
}

preflight() {
    [[ -f "$PANEL/artisan" && -f "$PANEL/config/app.php" ]] || fail "No Pterodactyl panel found at $PANEL (use --panel)."
    require git
    require yarn
    require php

    if [[ -e "$PANEL/blueprint.sh" || -d "$PANEL/.blueprint" ]]; then
        warn "Blueprint is installed on this panel."
        warn "If you use Blueprint addons, the Blueprint edition of this theme is recommended."
    fi

    local version
    version="$(panel_version)"
    if [[ ! "$version" =~ $SUPPORTED_RE ]]; then
        if [[ $FORCE -eq 1 ]]; then
            warn "Panel version '$version' is not on the supported list; continuing because of --force."
        else
            fail "Panel version '$version' is not supported by Graphite $THEME_VERSION. Re-run with --force to try anyway."
        fi
    fi
    info "Panel $version at $PANEL"
}

build_panel() {
    if [[ $BUILD -eq 0 ]]; then
        warn "Skipping the frontend build (--no-build). Run 'yarn build:production' in $PANEL yourself."
        return
    fi
    bold "Building the panel frontend (this can take a few minutes)"
    (cd "$PANEL" && NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=4096}" yarn build:production)
    (cd "$PANEL" && php artisan view:clear > /dev/null && php artisan config:clear > /dev/null && php artisan route:clear > /dev/null) || warn "Could not clear the Laravel caches; run php artisan optimize:clear manually."
}

backup() {
    local path="$1"
    if [[ -f "$STATE/backup/$path" || -f "$STATE/created/$path" ]]; then
        return
    fi
    if [[ -f "$PANEL/$path" ]]; then
        mkdir -p "$STATE/backup/$(dirname "$path")"
        cp -p "$PANEL/$path" "$STATE/backup/$path"
    else
        mkdir -p "$STATE/created/$(dirname "$path")"
        : > "$STATE/created/$path"
    fi
}

# Applies one manifest entry. Prints a single status word.
apply_file() {
    local kind="$1" path="$2"
    local target="$PANEL/$path" theme="$PKG/files/$path" stock="$PKG/stock/$path"

    if [[ -f "$target" ]] && cmp -s "$target" "$theme"; then
        echo "unchanged"; return
    fi

    if [[ ! -f "$target" ]]; then
        backup "$path"
        mkdir -p "$(dirname "$target")"
        cp "$theme" "$target"
        echo "added"; return
    fi

    if [[ "$kind" == "M" ]] && cmp -s "$target" "$stock"; then
        backup "$path"
        cp "$theme" "$target"
        echo "updated"; return
    fi

    # The file differs from stock (an addon or a different panel version), or a
    # new theme file already exists: merge the theme's changes into it.
    local base="$stock" merged
    if [[ "$kind" == "A" ]]; then base="/dev/null"; fi
    merged="$(mktemp)"
    if git merge-file -p -L panel -L stock -L graphite "$target" "$base" "$theme" > "$merged" 2> /dev/null; then
        backup "$path"
        cp "$merged" "$target"
        rm -f "$merged"
        echo "merged"
    else
        mv "$merged" "$target.theme-conflict"
        echo "conflict"
    fi
}

install_theme() {
    bold "Installing Graphite $THEME_VERSION"
    preflight

    if [[ -f "$STATE/installed" && "${REAPPLY:-0}" -ne 1 ]]; then
        fail "Graphite is already installed. Use 'reapply' to re-merge it, or 'uninstall' first."
    fi
    mkdir -p "$STATE"

    local conflicts=() counts=""
    while IFS=$'\t' read -r kind path; do
        if [[ -z "$path" ]]; then continue; fi
        result="$(apply_file "$kind" "$path")"
        counts+="$result"$'\n'
        if [[ "$result" == "conflict" ]]; then conflicts+=("$path"); fi
    done < "$PKG/MANIFEST"

    for result in added updated merged unchanged conflict; do
        n="$(grep -cx "$result" <<< "$counts" || true)"
        if [[ "$n" -gt 0 ]]; then info "$n file(s) $result"; fi
    done

    bold "Installing font dependencies"
    for file in package.json yarn.lock; do backup "$file"; done
    # shellcheck disable=SC2046
    (cd "$PANEL" && yarn add --dev --silent $(cat "$PKG/DEPENDENCIES"))

    echo "$THEME_VERSION" > "$STATE/installed"

    if [[ ${#conflicts[@]} -gt 0 ]]; then
        warn "${#conflicts[@]} file(s) could not be merged automatically and were left as they are:"
        for path in "${conflicts[@]}"; do warn "  $path  (see $path.theme-conflict)"; done
        warn "Resolve them (or send them to support), then run: ./install.sh reapply"
    fi

    build_panel
    bold "Done. Hard-refresh your browser to see the theme."
}

uninstall_theme() {
    bold "Uninstalling Graphite"
    [[ -d "$STATE" ]] || fail "Graphite does not appear to be installed at $PANEL."

    if [[ -d "$STATE/backup" ]]; then
        (cd "$STATE/backup" && find . -type f -print0) | while IFS= read -r -d '' file; do
            mkdir -p "$PANEL/$(dirname "$file")"
            cp -p "$STATE/backup/$file" "$PANEL/$file"
        done
    fi
    if [[ -d "$STATE/created" ]]; then
        (cd "$STATE/created" && find . -type f -print0) | while IFS= read -r -d '' file; do
            rm -f "$PANEL/$file"
        done
    fi
    find "$PANEL/resources" -name '*.theme-conflict' -delete 2> /dev/null || true
    rm -rf "$STATE"
    info "Restored all original files."

    (cd "$PANEL" && yarn install --frozen-lockfile --silent)
    build_panel
    bold "Done."
}

status_theme() {
    if [[ -f "$STATE/installed" ]]; then
        bold "Graphite $(cat "$STATE/installed") is installed at $PANEL"
        find "$PANEL/resources" -name '*.theme-conflict' 2> /dev/null | sed 's/^/  conflict: /'
    else
        bold "Graphite is not installed at $PANEL"
    fi
}

case "$ACTION" in
    install) install_theme ;;
    reapply) REAPPLY=1 install_theme ;;
    uninstall) uninstall_theme ;;
    status) status_theme ;;
    *)
        sed -n '3,14p' "$0" | sed 's/^# \{0,1\}//'
        exit 1
        ;;
esac
