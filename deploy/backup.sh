#!/usr/bin/env sh
set -eu

umask 077

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
BACKUP_DIR=${1:-"$PROJECT_DIR/backups"}
RETENTION=${CYBRENSE_BACKUP_RETENTION:-14}
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
ARCHIVE="$BACKUP_DIR/cbs-mail-$STAMP.tar.gz"

case "$RETENTION" in
  ''|*[!0-9]*)
    echo "CYBRENSE_BACKUP_RETENTION must be a non-negative integer" >&2
    exit 2
    ;;
esac

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

set --
for path in .env config/config.inc.php db; do
  if [ -e "$PROJECT_DIR/$path" ]; then
    set -- "$@" "$path"
  fi
done

if [ "$#" -eq 0 ]; then
  echo "Nothing to back up. Expected .env, config/config.inc.php, or db/." >&2
  exit 1
fi

tar -C "$PROJECT_DIR" -czf "$ARCHIVE" "$@"
chmod 600 "$ARCHIVE"

if [ "$RETENTION" -gt 0 ]; then
  find "$BACKUP_DIR" -maxdepth 1 -type f -name 'cbs-mail-*.tar.gz' -mtime "+$RETENTION" -delete
fi

echo "$ARCHIVE"
