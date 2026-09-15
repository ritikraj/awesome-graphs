#!/usr/bin/env sh
# Concatenate the v2 sources (in dependency order) into one drop-in script.
# Usage: sh v2/build.sh
set -e
cd "$(dirname "$0")"

FILES="
src/core/utils.js
src/core/tooltip.js
src/core/base-chart.js
src/charts/segment-ring.js
src/charts/arc-gauge.js
src/charts/combo-ring.js
src/charts/radar.js
src/charts/concentric-arcs.js
src/charts/segmented-dial.js
src/charts/needle-meter.js
"

mkdir -p dist
{
    echo "/*! Awesome Graphs v2 — bundled $(date -u +%Y-%m-%d). Source: v2/src */"
    for file in $FILES; do
        printf '\n/* ---- %s ---- */\n' "$file"
        cat "$file"
    done
} > dist/awesome-graphs.js

echo "Wrote v2/dist/awesome-graphs.js"
