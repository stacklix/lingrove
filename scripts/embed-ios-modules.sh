#!/bin/sh
set -eu

# Xcode launched from Finder does not inherit a terminal's Homebrew PATH.
export PATH="$PATH:/opt/homebrew/bin:/usr/local/bin"
if [ -n "${NODE_BINARY:-}" ]; then
  export PATH="$(dirname "$NODE_BINARY"):$PATH"
fi
command -v node >/dev/null 2>&1 || { echo "error: Install Node.js 24, or set NODE_BINARY in Xcode build settings." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "error: npm is required to build bundled modules." >&2; exit 1; }
cd "$SRCROOT/.."
if [ ! -d node_modules ]; then
  npm ci
fi
if [ "${CONFIGURATION:-Debug}" = "Release" ]; then
  npm run build:release
else
  npm run build
fi
npm run verify:release

# Copy directly into the product, including on a clean checkout with no generated resources.
# Replacing the directory also removes modules retired from modules.json.
destination="$TARGET_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH/BuiltinModules"
rm -rf "$destination"
mkdir -p "$(dirname "$destination")"
ditto ios/Lingrove/Resources/BuiltinModules "$destination"
python3 scripts/verify-ios-modules.py "$TARGET_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH"
