#!/bin/sh
set -eu
export TZ=${TZ:-Asia/Bangkok}
backup() {
  stamp=$(date +%F_%H%M)
  db="/backups/db_$stamp.sql.gz"
  media="/backups/uploads_$stamp.tar.gz"
  tmpdb="$db.tmp.$$"
  tmpmedia="$media.tmp.$$"
  trap 'rm -f "$tmpdb" "$tmpmedia"' EXIT HUP INT TERM
  # A pipeline would hide a failed dump under POSIX sh; use a temporary SQL file.
  sql="/backups/.dump.$$.sql"
  trap 'rm -f "$tmpdb" "$tmpmedia" "$sql"' EXIT HUP INT TERM
  mariadb-dump -h mariadb -u "$DB_USER" --single-transaction --routines --events --triggers "$DB_NAME" > "$sql"
  gzip -c "$sql" > "$tmpdb"
  gzip -t "$tmpdb"
  tar -czf "$tmpmedia" -C /uploads .
  mv "$tmpdb" "$db"
  mv "$tmpmedia" "$media"
  rm -f "$sql"
  find /backups -maxdepth 1 -type f \( -name 'db_*.sql.gz' -o -name 'uploads_*.tar.gz' \) -mtime "+${BACKUP_KEEP_DAYS:-30}" -delete
  trap - EXIT HUP INT TERM
  echo "$(date -Iseconds) backup completed: $stamp"
}
case "${1:-loop}" in
  now) backup; exit ;;
  restore) shift; exec sh /usr/local/bin/restore.sh "$@" ;;
  import)
    cd /backups
    # Require checksums for both payloads, not just an arbitrary manifest.
    awk '$2 == "allar_db.sql.gz" || $2 == "*allar_db.sql.gz" { db=1 } $2 == "uploads.zip" || $2 == "*uploads.zip" { uploads=1 } END { exit !(db && uploads) }' SHA256SUMS.txt
    sha256sum -c SHA256SUMS.txt
    gzip -t allar_db.sql.gz
    unzip -t uploads.zip >/dev/null
    gzip -dc allar_db.sql.gz > /backups/.import.$$.sql
    trap 'rm -f /backups/.import.$$.sql' EXIT HUP INT TERM
    mariadb -h mariadb -u "$DB_USER" "$DB_NAME" < /backups/.import.$$.sql
    unzip -o uploads.zip -d /restore-uploads >/dev/null
    chown -R 10001:10001 /restore-uploads
    echo "$(date -Iseconds) bundle imported"
    exit ;;
  loop)
    # The uploads volume may be created by this container first (owned by root);
    # the web container runs as uid 10001 and must be able to write to it.
    chown 10001:10001 /restore-uploads
    echo "$(date -Iseconds) backup scheduler started, daily at ${BACKUP_TIME:-02:00} (keep ${BACKUP_KEEP_DAYS:-30} days)" ;;
  *) echo "Usage: backup [now|restore|import]" >&2; exit 2 ;;
esac
case "${BACKUP_TIME:-02:00}" in
  [0-2][0-9]:[0-5][0-9]) ;;
  *) echo 'Invalid BACKUP_TIME (expected HH:MM)' >&2; exit 2 ;;
esac
while :; do
  target=$(date -d "today ${BACKUP_TIME:-02:00}" +%s) || exit 1
  current=$(date +%s)
  if [ "$target" -le "$current" ]; then target=$(date -d "tomorrow ${BACKUP_TIME:-02:00}" +%s); fi
  sleep "$((target - current))"
  if ! sh /usr/local/bin/backup.sh now; then echo "$(date -Iseconds) backup failed" >&2; fi
done
