#!/usr/bin/env bash
set -euo pipefail
build_url=$(gh api --method POST "repos/$GITHUB_REPOSITORY/pages/builds" --jq '.url')
for attempt in {1..30}; do
  build=$(gh api "$build_url")
  status=$(jq -r '.status' <<< "$build")
  commit=$(jq -r '.commit' <<< "$build")
  if [ "$commit" = "$RELEASE_COMMIT" ] && [ "$status" = built ]; then
    echo "Pages published commit $RELEASE_COMMIT." >> "$GITHUB_STEP_SUMMARY"
    exit 0
  fi
  if [ "$commit" = "$RELEASE_COMMIT" ] && [ "$status" = errored ]; then
    jq -r '.error.message' <<< "$build" >&2
    exit 1
  fi
  sleep 10
done
echo "Timed out waiting for Pages to build $RELEASE_COMMIT" >&2
exit 1
