#!/usr/bin/env bash
# Publishers hold the shared publish-gh-pages lock before calling this.
set -euo pipefail
node "$(dirname "$0")/publish-pages-tree.mjs" "$@"
