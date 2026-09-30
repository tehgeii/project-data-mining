<#
.SYNOPSIS
    Ambil URL riwayat Signal Search Zenless Zone Zero dari cache game (Windows).

.DESCRIPTION
    Script ini HANYA MEMBACA dua file di komputer kamu:
      1. Log game  : %USERPROFILE%\AppData\LocalLow\miHoYo\ZenlessZoneZero\Player.log
                     (untuk mencari folder instalasi game)
      2. Cache web : <folder game>\ZenlessZoneZero_Data\webCaches\<versi>\Cache\Cache_Data\data_2
                     (tempat URL riwayat gacha tersimpan)
    Lalu URL terbaru disalin ke clipboard. Script TIDAK mengirim data ke mana pun,
    tidak mengubah file game, dan tidak butuh hak administrator.

    Sebelum menjalankan: buka game, buka Signal Search -> History, tunggu sampai
    riwayat tampil.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\get_zzz_url.ps1
#>

[CmdletBinding()]
param(
    # Opsional: folder ZenlessZoneZero_Data kalau deteksi otomatis gagal.
    [string]$GameDataPath
)

$ErrorActionPreference = 'Stop'

function Write-Fail([string]$Message) {
    Write-Host ""
    Write-Host "GAGAL: $Message" -ForegroundColor Red
    exit 1
}

function Read-SharedText([string]$Path) {
    # Buka dengan FileShare.ReadWrite supaya tetap bisa dibaca saat game berjalan.
    $stream = [System.IO.File]::Open($Path, 'Open', 'Read', 'ReadWrite')
    try {
        $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
        return $reader.ReadToEnd()
    } finally {
        $stream.Dispose()
    }
}

function Find-GameDataPath {
    $logDirs = @(
        (Join-Path $env:USERPROFILE 'AppData\LocalLow\miHoYo\ZenlessZoneZero'),
        # nama folder server China, ditulis dengan kode karakter supaya
        # file ini tetap ASCII dan aman dibaca Windows PowerShell 5.1
        (Join-Path $env:USERPROFILE ('AppData\LocalLow\miHoYo\' + [string]::new([char[]](0x7EDD, 0x533A, 0x96F6))))
    )
    foreach ($dir in $logDirs) {
        foreach ($name in @('Player.log', 'Player-prev.log')) {
            $log = Join-Path $dir $name
            if (-not (Test-Path -LiteralPath $log)) { continue }
            $text = Read-SharedText $log
            $found = [regex]::Matches($text, '([A-Za-z]:[\\/][^\r\n"]*?ZenlessZoneZero_Data)')
            for ($i = $found.Count - 1; $i -ge 0; $i--) {
                $candidate = $found[$i].Groups[1].Value -replace '/', '\'
                if (Test-Path -LiteralPath (Join-Path $candidate 'webCaches')) {
                    return $candidate
                }
            }
        }
    }
    return $null
}

Write-Host "== Pengambil URL riwayat gacha Zenless Zone Zero ==" -ForegroundColor Cyan

if (-not $GameDataPath) {
    $GameDataPath = Find-GameDataPath
}
if (-not $GameDataPath -or -not (Test-Path -LiteralPath (Join-Path $GameDataPath 'webCaches'))) {
    Write-Fail ("Folder game tidak ditemukan. Jalankan game minimal sekali, atau isi manual:`n" +
        "  powershell -ExecutionPolicy Bypass -File .\get_zzz_url.ps1 -GameDataPath 'D:\...\ZenlessZoneZero_Data'")
}
Write-Host "Folder game : $GameDataPath"

# Pilih folder cache dengan versi terbesar (mis. 2.0.0.3 > 1.9.0.1).
$webCaches = Join-Path $GameDataPath 'webCaches'
$versionDirs = Get-ChildItem -LiteralPath $webCaches -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match '^\d+\.\d+\.\d+\.\d+$' } |
    Sort-Object { [version]$_.Name } -Descending
$cacheFile = $null
foreach ($dir in $versionDirs) {
    $candidate = Join-Path $dir.FullName 'Cache\Cache_Data\data_2'
    if (Test-Path -LiteralPath $candidate) { $cacheFile = $candidate; break }
}
if (-not $cacheFile) {
    $candidate = Join-Path $webCaches 'Cache\Cache_Data\data_2'
    if (Test-Path -LiteralPath $candidate) { $cacheFile = $candidate }
}
if (-not $cacheFile) {
    Write-Fail "File cache tidak ditemukan. Buka Signal Search -> History di game dulu, lalu jalankan lagi."
}
Write-Host "File cache  : $cacheFile"

# Cache berisi banyak entri yang dipisahkan '1/0/'. Ambil URL getGachaLog terbaru.
$stream = [System.IO.File]::Open($cacheFile, 'Open', 'Read', 'ReadWrite')
try {
    $buffer = New-Object byte[] $stream.Length
    $offset = 0
    while ($offset -lt $buffer.Length) {
        $read = $stream.Read($buffer, $offset, $buffer.Length - $offset)
        if ($read -le 0) { break }
        $offset += $read
    }
} finally {
    $stream.Dispose()
}
$content = [System.Text.Encoding]::UTF8.GetString($buffer)
$parts = $content -split '1/0/'

$url = $null
for ($i = $parts.Length - 1; $i -ge 0; $i--) {
    $part = $parts[$i]
    if (-not $part.StartsWith('http') -or -not $part.Contains('getGachaLog')) { continue }
    $candidate = ($part -split "`0")[0].Trim()
    try { $uri = [System.Uri]$candidate } catch { continue }
    $hostOk = $uri.Host -match '(^|\.)(hoyoverse|mihoyo)\.com$'
    if ($uri.Scheme -eq 'https' -and $hostOk -and $uri.AbsolutePath.EndsWith('/getGachaLog')) {
        $url = $candidate
        break
    }
}

if (-not $url) {
    Write-Fail "URL riwayat tidak ditemukan di cache. Buka Signal Search -> History di game, tunggu sampai tampil, lalu jalankan lagi."
}

Write-Host ""
try {
    Set-Clipboard -Value $url
    Write-Host "BERHASIL! URL riwayat sudah disalin ke clipboard." -ForegroundColor Green
} catch {
    Write-Host "URL ditemukan, tapi gagal menyalin ke clipboard. Salin manual URL di bawah ini:" -ForegroundColor Yellow
    Write-Host $url
}
Write-Host "Tempel (Ctrl+V) di halaman Import Data -> tab 'URL (PC)'."
Write-Host "URL berlaku sekitar 24 jam. Jangan bagikan URL ini ke orang lain." -ForegroundColor Yellow
