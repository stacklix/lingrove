#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
fixture_dir=$(mktemp -d /private/tmp/lingrove-core.XXXXXX)
trap 'rm -rf "$fixture_dir"' EXIT
python3 scripts/tests/make-fixtures.py "$fixture_dir"
swiftc -parse-as-library -module-cache-path /private/tmp/lingrove-swift-cache ios/Lingrove/Core/*.swift ios/Tests/CoreChecks.swift -o "$fixture_dir/checks"
"$fixture_dir/checks" "$fixture_dir"
