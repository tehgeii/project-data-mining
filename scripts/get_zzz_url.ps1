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
    # Opsional: folder instalasi game kalau deteksi otomatis gagal. Boleh folder
    # utama (mis. '...\steamapps\common\Zenless Zone Zero') atau langsung
    # folder 'ZenlessZoneZero_Data'.
    [string]$GameDataPath
)

$ErrorActionPreference = 'Stop'

function Write-Fail([string]$Message) {
    Write-Host ""
    Write-Host "GAGAL: $Message" -ForegroundColor Red
    exit 1
}

function Read-SharedBytes([string]$Path) {
    # File cache sedang dipegang game. Game membuka file itu dengan izin
    # berbagi Read + Write + Delete, jadi kita juga harus meminta ketiganya,
    # kalau tidak Windows menolak dengan "being used by another process".
    try {
        $stream = [System.IO.File]::Open(
            $Path,
            [System.IO.FileMode]::Open,
            [System.IO.FileAccess]::Read,
            ([System.IO.FileShare]::ReadWrite -bor [System.IO.FileShare]::Delete))
        try {
            $buffer = New-Object byte[] $stream.Length
            $offset = 0
            while ($offset -lt $buffer.Length) {
                $read = $stream.Read($buffer, $offset, $buffer.Length - $offset)
                if ($read -le 0) { break }
                $offset += $read
            }
            return ,$buffer
        } finally {
            $stream.Dispose()
        }
    } catch { }

    # Cadangan: salin dulu ke folder sementara, lalu baca salinannya.
    $temp = Join-Path ([System.IO.Path]::GetTempPath()) ("zzz_cache_" + [guid]::NewGuid().ToString('N'))
    try {
        Copy-Item -LiteralPath $Path -Destination $temp -Force -ErrorAction Stop
        return ,[System.IO.File]::ReadAllBytes($temp)
    } catch {
        return $null
    } finally {
        Remove-Item -LiteralPath $temp -Force -ErrorAction SilentlyContinue
    }
}

function Read-SharedText([string]$Path) {
    $bytes = Read-SharedBytes $Path
    if ($null -eq $bytes) { return '' }
    return [System.Text.Encoding]::UTF8.GetString($bytes)
}

function Resolve-DataPath([string]$Path) {
    # Terima folder utama instalasi (Steam / HoYoPlay / Epic) maupun folder
    # ZenlessZoneZero_Data, lalu kembalikan folder yang berisi webCaches.
    if (-not $Path) { return $null }
    $subs = @(
        '',
        'ZenlessZoneZero_Data',
        'ZenlessZoneZero Game\ZenlessZoneZero_Data',
        'games\ZenlessZoneZero Game\ZenlessZoneZero_Data'
    )
    foreach ($sub in $subs) {
        $candidate = if ($sub) { Join-Path $Path $sub } else { $Path }
        if (Test-Path -LiteralPath (Join-Path $candidate 'webCaches')) {
            return $candidate
        }
    }
    return $null
}

function Find-FromPlayerLog {
    # Cara utama: log game mencatat lokasi instalasi, apa pun launcher-nya.
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
                $candidate = Resolve-DataPath ($found[$i].Groups[1].Value -replace '/', '\')
                if ($candidate) { return $candidate }
            }
        }
    }
    return $null
}

function Get-SteamLibraries {
    $roots = @()
    try {
        $steamPath = (Get-ItemProperty -Path 'HKCU:\Software\Valve\Steam' -Name SteamPath -ErrorAction Stop).SteamPath
        if ($steamPath) { $roots += ($steamPath -replace '/', '\') }
    } catch { }
    if (${env:ProgramFiles(x86)}) { $roots += (Join-Path ${env:ProgramFiles(x86)} 'Steam') }
    $libs = @()
    foreach ($root in $roots) {
        $libs += $root
        $vdf = Join-Path $root 'steamapps\libraryfolders.vdf'
        if (Test-Path -LiteralPath $vdf) {
            foreach ($m in [regex]::Matches((Read-SharedText $vdf), '"path"\s*"([^"]+)"')) {
                $libs += ($m.Groups[1].Value -replace '\\\\', '\')
            }
        }
    }
    return $libs | Select-Object -Unique
}

function Find-FromKnownFolders {
    # Cadangan kalau log tidak ada: cek lokasi instalasi yang umum.
    $bases = @()
    foreach ($lib in Get-SteamLibraries) {
        $bases += (Join-Path $lib 'steamapps\common\Zenless Zone Zero')
    }
    foreach ($pf in @($env:ProgramFiles, ${env:ProgramFiles(x86)})) {
        if (-not $pf) { continue }
        $bases += (Join-Path $pf 'HoYoPlay\games')
        $bases += (Join-Path $pf 'Epic Games\ZenlessZoneZero')
    }
    foreach ($base in $bases) {
        $candidate = Resolve-DataPath $base
        if ($candidate) { return $candidate }
    }
    return $null
}

$ScriptVersion = '1.2'
Write-Host "== Pengambil URL riwayat gacha Zenless Zone Zero (versi $ScriptVersion) ==" -ForegroundColor Cyan

if ($GameDataPath) {
    $resolved = Resolve-DataPath $GameDataPath
    if (-not $resolved) {
        Write-Fail "Folder '$GameDataPath' tidak berisi data game (webCaches). Periksa lagi lokasinya."
    }
    $GameDataPath = $resolved
} else {
    $GameDataPath = Find-FromPlayerLog
    if (-not $GameDataPath) { $GameDataPath = Find-FromKnownFolders }
}
if (-not $GameDataPath) {
    Write-Fail ("Folder game tidak ditemukan. Jalankan game minimal sekali, atau isi lokasi instalasi manual, contoh:`n" +
        "  powershell -ExecutionPolicy Bypass -File .\get_zzz_url.ps1 -GameDataPath 'D:\SteamLibrary\steamapps\common\Zenless Zone Zero'")
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
$buffer = Read-SharedBytes $cacheFile
if ($null -eq $buffer) {
    $running = Get-Process -ErrorAction SilentlyContinue |
        Where-Object { $_.ProcessName -like 'ZenlessZoneZero*' } |
        Select-Object -ExpandProperty ProcessName -Unique
    $hint = if ($running) {
        "Game masih berjalan di latar belakang ($($running -join ', ')). Tutup lewat Task Manager, lalu jalankan lagi."
    } else {
        "Tutup game dulu (URL tetap tersimpan setelah game ditutup), lalu jalankan script ini lagi."
    }
    Write-Fail "File cache sedang dikunci oleh program lain. $hint"
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
