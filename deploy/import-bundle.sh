#!/bin/sh
# Place allar_db.sql.gz, uploads.zip and SHA256SUMS.txt in deploy/backups first.
set -eu
cd "$(dirname "$0")"
docker compose run --rm backup import
