#!/usr/bin/env sh
set -eu

BASE_URL=${1:-http://127.0.0.1:8090}
BASE_URL=${BASE_URL%/}

check_url() {
  url=$1
  label=$2
  if ! curl --fail --silent --show-error --location --max-time 10 "$url" >/dev/null; then
    echo "FAILED: $label ($url)" >&2
    exit 1
  fi
  echo "OK: $label"
}

check_url "$BASE_URL/" "Roundcube login"
check_url "$BASE_URL/cybrense-manifest.json" "PWA manifest"
check_url "$BASE_URL/offline.html" "offline fallback"

echo "CBS Mail is healthy at $BASE_URL"
