# Restore test: loads the newest backup into a throwaway database (allar_restore_test),
# compares table counts with allar_db, then drops the test database. Never touches allar_db.
# Usage: powershell -File restore-test.ps1 [path\to\backup.sql.gz]
param([string]$File)
$ErrorActionPreference = 'Stop'
$container = 'allar_mariadb'
$dir = Join-Path $PSScriptRoot 'backups'
if (-not $File) {
  $File = (Get-ChildItem $dir -Filter 'allar_db_*.sql.gz' | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
}
if (-not $File) { Write-Host 'No backup file found.'; exit 1 }
Write-Host "Testing restore of $(Split-Path $File -Leaf)"

# SQL goes in on stdin so no nested quotes reach docker (PowerShell 5.1 mangles them).
function Sql([string]$q) { $q | docker exec -i $container sh -c 'mariadb -uroot -p$MARIADB_ROOT_PASSWORD -N' }

docker cp $File "${container}:/tmp/restore-test.sql.gz" | Out-Null
Sql 'DROP DATABASE IF EXISTS allar_restore_test; CREATE DATABASE allar_restore_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;'
docker exec $container sh -c 'gunzip -c /tmp/restore-test.sql.gz | mariadb -uroot -p$MARIADB_ROOT_PASSWORD allar_restore_test'
if ($LASTEXITCODE -ne 0) { Write-Host 'Restore FAILED'; exit 1 }

Write-Host 'Tables per database (allar_db vs restored copy):'
Sql "SELECT s.schema_name, COUNT(t.table_name) FROM information_schema.schemata s LEFT JOIN information_schema.tables t ON t.table_schema = s.schema_name WHERE s.schema_name IN ('allar_db','allar_restore_test') GROUP BY s.schema_name;"
Sql 'DROP DATABASE allar_restore_test;'
docker exec $container rm -f /tmp/restore-test.sql.gz | Out-Null
Write-Host 'Restore test OK (test database dropped).'
