#!/bin/sh
# One-time import of the separately delivered data bundle.
# Put allar_db.sql.gz, uploads.zip and SHA256SUMS.txt in deploy/backups/ first, then run:
#   sh import-bundle.sh
# (On Windows without sh: docker compose run --rm backup import && docker compose restart web)
set -eu
cd "$(dirname "$0")"
docker compose run --rm backup import
# The web app caches content in memory; restart it so the imported data shows immediately.
docker compose restart web
