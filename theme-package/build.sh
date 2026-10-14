#!/usr/bin/env bash
#
# Builds the distributable Graphite theme archive from this repository.
#
#   theme-package/build.sh [version]
#
# The archive contains every file the theme adds or changes relative to the
# upstream panel commit in theme-package/BASE_REF, the upstream ("stock")
# version of each changed file for three-way merging, and the installer.
#
# For a release, BASE_REF should be the panel release tag the theme targets
# (e.g. v1.11.11) with the theme rebased onto it.
set -euo pipefail

ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
cd "$ROOT"

BASE_REF="$(tr -d '[:space:]' < theme-package/BASE_REF)"
VERSION="${1:-$(git describe --tags --always 2>/dev/null || echo dev)}"
NAME="graphite-theme-${VERSION}"
OUT="$ROOT/theme-package/dist"
STAGE="$OUT/$NAME"

# Files that are never shipped: packaging itself, dependency manifests (which
# the installer updates with yarn instead of overwriting), and addons installed
# on this panel. Addons are third-party products with their own licences; the
# theme only ships the generic loader (app/Services/Addons, resources/scripts/addons/index.ts).
EXCLUDE='^(theme-package/|package\.json$|yarn\.lock$|app/Addons/|config/addons/|resources/views/addons/|resources/scripts/addons/[^/]+/|tests/(Integration|Unit)/Addons/)'

git cat-file -e "${BASE_REF}^{commit}" 2>/dev/null || {
    echo "BASE_REF ${BASE_REF} is not available locally; fetch it first." >&2
    exit 1
}

rm -rf "$STAGE" "$OUT/$NAME.zip"
mkdir -p "$STAGE/files" "$STAGE/stock"

: > "$STAGE/MANIFEST"
while IFS=$'\t' read -r status path; do
    [[ "$path" =~ $EXCLUDE ]] && continue
    case "$status" in
        A)
            echo "A	$path" >> "$STAGE/MANIFEST"
            ;;
        M)
            echo "M	$path" >> "$STAGE/MANIFEST"
            mkdir -p "$STAGE/stock/$(dirname "$path")"
            git show "${BASE_REF}:$path" > "$STAGE/stock/$path"
            ;;
        *)
            echo "Unsupported change '$status' for $path (renames/deletions are not supported)." >&2
            exit 1
            ;;
    esac
    mkdir -p "$STAGE/files/$(dirname "$path")"
    cp "$path" "$STAGE/files/$path"
done < <(git diff --no-renames --name-status "$BASE_REF" HEAD)

# Dependencies the theme needs, installed by the installer with yarn.
# Guard against shipping something that depends on an excluded addon.
if grep -rlE 'Pterodactyl\\Addons\\|@/addons/[A-Za-z0-9_-]+' "$STAGE/files" >/dev/null 2>&1; then
    echo "These files reference addon code that is not part of the theme:" >&2
    grep -rlE 'Pterodactyl\\Addons\\|@/addons/[A-Za-z0-9_-]+' "$STAGE/files" >&2
    exit 1
fi

cat > "$STAGE/DEPENDENCIES" <<'DEPS'
@fontsource-variable/geist@5.3.0
@fontsource-variable/geist-mono@5.3.0
DEPS

cp theme-package/installer.sh "$STAGE/install.sh"
cp theme-package/README.md "$STAGE/README.md"
echo "$VERSION" > "$STAGE/VERSION"
echo "$BASE_REF" > "$STAGE/BASE_REF"
chmod +x "$STAGE/install.sh"

(cd "$OUT" && zip -qr "$NAME.zip" "$NAME")
echo "Built $OUT/$NAME.zip ($(wc -l < "$STAGE/MANIFEST") files)"
