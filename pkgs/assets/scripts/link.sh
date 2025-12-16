#!/usr/bin/env bash

# This script links assets to corresponding location in the repository.
# Essentially, it's a catalog of assets symlinks.

set -eo pipefail

on_error() {
  status=$?
  echo
  echo "🔴 Error: exit $status"
  echo "  code: $BASH_COMMAND"
  echo "  at: ${BASH_SOURCE[0]}:${LINENO}"
  exit "$status"
}

trap on_error ERR

echo "⚡️ Linking assets"

assets_dir="$(realpath "$(dirname "$0")/..")"
repo_dir="$(realpath "$assets_dir/../..")"
source_dir="$assets_dir/public"

cd "$repo_dir" || exit 1

logotype_variants_svg="logotype-light.svg logotype-dark.svg"
logotype_variants_png="logotype-light-380.png logotype-dark-380.png"
vsc_screenshots="vsc-screenshot-vsc-windows-dark.png"

declare -A assets=(
  ["docs/assets"]="$logotype_variants_svg $vsc_screenshots"
  ["pkgs/vsc-extension/docs/assets"]="$logotype_variants_png $vsc_screenshots"
  ["pkgs/vsc-extension/icons"]="icon-toolbar.svg"
  ["pkgs/home/public"]="$vsc_screenshots"
)

for target_dir in "${!assets[@]}"; do
  echo -e "\n🌀 Linking $target_dir\n"
  mkdir -p "$target_dir"


  #region Clean up
  echo "  🌀 Cleaning outdated symlinks..."

  cleaned_count=0
  expected_assets=" ${assets[$target_dir]} "

  shopt -s nullglob

  for entry_path in "$target_dir"/*; do
    [[ -L "$entry_path" ]] || continue

    entry_name="$(basename "$entry_path")"
    resolved_path="$(realpath "$entry_path")"

    if [[ "$resolved_path" == "$source_dir/"* ]]; then
      if [[ ! -e "$resolved_path" ]] || [[ "$expected_assets" != *" $entry_name "* ]]; then
        rel_entry_path="$(realpath --relative-to="$repo_dir" "$entry_path")"
        echo "  🔸 $rel_entry_path"
        rm -f "$entry_path"
        ((++cleaned_count))
      fi
    fi
  done

  if (( cleaned_count > 0 )); then
    echo "  🟢 Cleaned $cleaned_count outdated links"
  else
    echo "  🔵 No outdated links found"
  fi
  echo

  shopt -u nullglob

  #endregion

  #region Linking

  echo "  🌀 Linking new assets..."

  linked_count=0

  for asset in ${assets[$target_dir]}; do
    source_path="$source_dir/$asset"
    target_path="$target_dir/$asset"

    rel_expected_path="$(realpath --relative-to="$target_dir" "$source_path")"

    if [[ -L "$target_path" ]]; then
      rel_current_path="$(readlink "$target_path")"
      if [[ "$rel_current_path" == "$rel_expected_path" ]]; then
        continue
      fi
    fi

    echo "  🔹 $target_dir/$asset"
    ln -sf "$rel_expected_path" "$target_path"
    ((++linked_count))
  done

  if (( linked_count > 0 )); then
    echo "  🟢 Linked $linked_count new assets"
  else
    echo "  🔵 No new links required"
  fi

  #endregion
done

echo -e "\n💚 Assets linked!"
