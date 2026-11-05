# Run once on the server inside C:\apps\allar. Creates .env with random passwords.
# Never prints the passwords. Refuses to overwrite an existing .env.
$ErrorActionPreference = 'Stop'
$envFile = Join-Path $PSScriptRoot '.env'
if (Test-Path $envFile) { Write-Host '.env already exists - not overwritten.'; exit 0 }

function New-Secret([int]$len = 32) {
  $chars = [char[]]'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  $bytes = New-Object byte[] $len
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  -join ($bytes | ForEach-Object { $chars[$_ % $chars.Length] })
}

@(
  "DB_ROOT_PASSWORD=$(New-Secret)"
  'DB_NAME=allar_db'
  'DB_USER=allar_user'
  "DB_PASSWORD=$(New-Secret)"
) | Set-Content -Path $envFile -Encoding ascii

# Only the current user may read .env
icacls $envFile /inheritance:r /grant "${env:USERNAME}:F" /grant 'SYSTEM:F' | Out-Null
Write-Host '.env created (passwords hidden).'
