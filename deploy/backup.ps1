# Daily MariaDB backup for allar_db. Run on the server from C:\apps\allar.
# Output: backups\allar_db_YYYY-MM-DD_HHmm.sql.gz, keeps 30 days, log in backups\backup.log.
# The dump and gzip run inside the container so PowerShell never touches the binary stream.
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$dir = Join-Path $root 'backups'
$log = Join-Path $dir 'backup.log'
$keepDays = 30
$container = 'allar_mariadb'
New-Item -ItemType Directory -Force $dir | Out-Null

function Log($msg) { "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg" | Add-Content $log }

try {
  $name = "allar_db_$(Get-Date -Format 'yyyy-MM-dd_HHmm').sql.gz"
  $tmp = "/tmp/$name"
  # Single database without --databases, so a dump can be restored into another DB for testing.
  # No nested quotes: Windows PowerShell 5.1 mangles them when calling native exes.
  # The password is alphanumeric (setup-env.ps1), so it needs no quoting inside sh.
  docker exec $container sh -c "mariadb-dump -uroot -p`$MARIADB_ROOT_PASSWORD --single-transaction --routines --events --triggers allar_db | gzip > $tmp && gzip -t $tmp"
  if ($LASTEXITCODE -ne 0) { throw "mariadb-dump failed (exit $LASTEXITCODE)" }
  docker cp "${container}:$tmp" (Join-Path $dir $name) | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "docker cp failed (exit $LASTEXITCODE)" }
  docker exec $container rm -f $tmp | Out-Null

  $size = (Get-Item (Join-Path $dir $name)).Length
  Log "OK $name ($size bytes)"

  Get-ChildItem $dir -Filter 'allar_db_*.sql.gz' |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$keepDays) } |
    ForEach-Object { Remove-Item $_.FullName; Log "deleted old $($_.Name)" }
  Write-Host "Backup OK: $name ($size bytes)"
} catch {
  Log "FAILED $_"
  Write-Host "Backup FAILED: $_"
  exit 1
}
