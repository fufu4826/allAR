#!/bin/sh
set -eu
if [ "${1:-}" != --yes ] || [ "$#" -lt 2 ]; then
  echo 'Usage: restore --yes /backups/db_....sql.gz [/backups/uploads_....tar.gz]' >&2
  exit 2
fi
shift
for archive do
  case "$archive" in
    /backups/db_*.sql.gz)
      gzip -t "$archive"
      sql="/backups/.restore.$$.sql"
      trap 'rm -f "$sql"' EXIT HUP INT TERM
      gzip -dc "$archive" > "$sql"
      mariadb -h mariadb -u "$DB_USER" "$DB_NAME" < "$sql"
      rm -f "$sql"
      trap - EXIT HUP INT TERM ;;
    /backups/uploads_*.tar.gz)
      gzip -t "$archive"
      tar -tzf "$archive" >/dev/null
      find /restore-uploads -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
      tar -xzf "$archive" -C /restore-uploads
      chown -R 10001:10001 /restore-uploads ;;
    *) echo "Unsupported archive: $archive" >&2; exit 2 ;;
  esac
done
