#!/usr/bin/env bash
# Both publishers hold the publish-gh-pages concurrency lock before calling this.
set -euo pipefail
mode=$1
source_dir=$(cd "$2" && pwd)
repository=$(pwd)
temporary=$(mktemp -d)
trap 'rm -rf "$temporary"' EXIT
mkdir "$temporary/site"
previous=''
if git ls-remote --exit-code origin refs/heads/gh-pages > "$temporary/ref"; then
  git fetch --no-tags origin +refs/heads/gh-pages:refs/remotes/origin/gh-pages
  previous=$(git rev-parse refs/remotes/origin/gh-pages)
else
  status=$?
  # ls-remote uses 2 for a missing ref. Network/auth failures must not erase content.
  if [ "$status" != 2 ]; then exit "$status"; fi
fi
case "$mode" in
  web)
    test -s "$source_dir/catalog.snapshot.json"
    cp -R "$source_dir/." "$temporary/site/"
    if [ -n "$previous" ] && git cat-file -e "$previous:ios" 2>/dev/null; then
      rm -rf "$temporary/site/ios"
      git archive "$previous" ios | tar -x -C "$temporary/site"
    else
      mkdir -p "$temporary/site/ios"
      cp "$repository/web/ios-pending.html" "$temporary/site/ios/index.html"
    fi
    ;;
  ios)
    if [ -z "$previous" ]; then echo 'Run the web Pages workflow first.' >&2; exit 1; fi
    git archive "$previous" | tar -x -C "$temporary/site"
    rm -rf "$temporary/site/ios"
    mkdir "$temporary/site/ios"
    cp -R "$source_dir/." "$temporary/site/ios/"
    ;;
  *) echo 'Usage: publish-pages-tree.sh web|ios DIRECTORY' >&2; exit 1 ;;
esac
test -s "$temporary/site/index.html"
touch "$temporary/site/.nojekyll"
git config user.name 'github-actions[bot]'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
export GIT_DIR="$repository/.git"
export GIT_WORK_TREE="$temporary/site"
export GIT_INDEX_FILE="$temporary/index"
git read-tree --empty
cd "$GIT_WORK_TREE"
git add --all -- .
tree=$(git write-tree)
# Keep the existing single-commit publication policy. The lease also protects
# against writers outside the shared Actions concurrency group.
commit=$(git commit-tree "$tree" -m "Publish $mode ($SOURCE_SHA)")
git push --force-with-lease="refs/heads/gh-pages:$previous" origin "$commit:refs/heads/gh-pages"
echo "commit=$commit" >> "$GITHUB_OUTPUT"
