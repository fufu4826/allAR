#!/bin/sh
set -eu
attempt=1
until node scripts/migrate.mjs; do
  if [ "$attempt" -ge 30 ]; then
    echo "Migrations failed after $attempt attempts" >&2
    exit 1
  fi
  attempt=$((attempt + 1))
  sleep 2
done
exec node server.js
