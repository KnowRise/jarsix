#!/usr/bin/env bash
# Kompres semua gambar mentah (jpg/jpeg/png) di static/images/ menjadi WebP.
# Rekursif (termasuk subfolder seperti members/ dan logo/).
# Idempoten: file yang sudah .webp dilewati, aman dijalankan berulang.
#
# Pemakaian: bash scripts/compress-images.sh
# Butuh: ImageMagick 7 (magick)

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

MAX_SIDE=1600
QUALITY=82

LOGO_MAX_SIDE=800
LOGO_QUALITY=85

IMG_FIND=(find static/images -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' \))
SRC_FIND=(find static/images -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \))

if ! command -v magick >/dev/null 2>&1; then
  echo "Error: ImageMagick (magick) tidak ditemukan." >&2
  exit 1
fi

human() { # bytes -> KB/MB
  awk -v b="$1" 'BEGIN { if (b >= 1048576) printf "%.2f MB", b/1048576; else printf "%.0f KB", b/1024 }'
}

sum_sizes() {
  local total=0 f
  while IFS= read -r -d '' f; do
    total=$((total + $(stat -c%s "$f")))
  done < <("$@" -print0)
  echo "$total"
}

compress() { # $1=src $2=max_side $3=quality
  local src="$1" max="$2" q="$3"
  local dir base out before after
  dir="$(dirname "$src")"
  base="$(basename "$src")"
  base="${base%.*}"
  out="$dir/$base.webp"

  before=$(stat -c%s "$src")
  magick "$src" -auto-orient -strip -resize "${max}x${max}>" -quality "$q" "webp:${out}"
  after=$(stat -c%s "$out")

  if (( after < before )); then
    rm -f "$src"
    printf '  %-48s %9s -> %9s\n' "${src#static/images/} -> ${base}.webp" "$(human "$before")" "$(human "$after")"
  else
    rm -f "$out"
    printf '  %-48s %9s  (sudah optimal, dilewati)\n' "${src#static/images/}" "$(human "$before")"
  fi
}

total_before=$(sum_sizes "${IMG_FIND[@]}")

echo "Kompresi gambar -> WebP (logo: max ${LOGO_MAX_SIDE}px q${LOGO_QUALITY}; lainnya: max ${MAX_SIDE}px q${QUALITY})"
echo

while IFS= read -r -d '' img; do
  if [[ "$img" == static/images/logo/* ]]; then
    compress "$img" "$LOGO_MAX_SIDE" "$LOGO_QUALITY"
  else
    compress "$img" "$MAX_SIDE" "$QUALITY"
  fi
done < <("${SRC_FIND[@]}" -print0 | sort -z)

total_after=$(sum_sizes "${IMG_FIND[@]}")

echo
printf 'Total: %s -> %s\n' "$(human "$total_before")" "$(human "$total_after")"
echo "Sisa file mentah (jpg/png): $( "${SRC_FIND[@]}" | wc -l )"
