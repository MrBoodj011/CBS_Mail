#!/usr/bin/env sh
set -eu

BASE_URL=${1:-http://127.0.0.1:8090}
BASE_URL=${BASE_URL%/}

check_content() {
  url=$1
  label=$2
  pattern=$3
  if ! curl --fail --silent --show-error --location --max-time 10 "$url" | grep -Eq "$pattern"; then
    echo "FAILED: $label ($url)" >&2
    exit 1
  fi
  echo "OK: $label"
}

check_content "$BASE_URL/" "Roundcube login" 'name="_user"'
check_content "$BASE_URL/cybrense-manifest.json" "PWA manifest" '"name"[[:space:]]*:[[:space:]]*"Cybrense Mail"'
check_content "$BASE_URL/offline.html" "offline fallback" 'Aucun contenu de vos courriels'

echo "CBS Mail is healthy at $BASE_URL"
