#!/usr/bin/env bash
set -euo pipefail

tmp_dir="$(mktemp -d)"
trap 'rm -rf -- "$tmp_dir"' EXIT

git init -q "$tmp_dir/source"
git -C "$tmp_dir/source" -c user.name=Codex -c user.email=codex@example.invalid \
  commit --allow-empty -qm 'synthetic mirror test'
git clone -q --bare "$tmp_dir/source" "$tmp_dir/bare.git"

for repository in "$tmp_dir/source" "$tmp_dir/bare.git"; do
  if ! git -C "$repository" rev-parse --git-dir >/dev/null 2>&1; then
    echo "Git mirror not recognized: $repository" >&2
    exit 1
  fi
  git clone -q --no-local "$repository" "$tmp_dir/worktree-$(basename "$repository")"
done

echo "Bare and working Git repositories both clone successfully."
