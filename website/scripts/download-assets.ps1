# Download every unique asset URL referenced in scraped/*.md to assets/images/
# Skips already-downloaded files. Writes a manifest URL -> local path mapping.

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$scraped = Join-Path $root 'scraped'
$out = Join-Path $root 'assets\images'
$manifest = Join-Path $root 'assets\asset-manifest.json'

New-Item -ItemType Directory -Force -Path $out | Out-Null

# Collect every URL across scraped/*.md
$urls = New-Object System.Collections.Generic.HashSet[string]
Get-ChildItem -Path $scraped -Filter *.md | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    # Match URLs on ontargetaba.com that look like assets (image/svg)
    $matches = [regex]::Matches($content, 'https?://[^\s)"''<>]+\.(png|jpg|jpeg|gif|svg|webp|ico)', 'IgnoreCase')
    foreach ($m in $matches) { [void]$urls.Add($m.Value) }
}

Write-Host ("Found {0} unique asset URLs" -f $urls.Count)

$map = @{}
$i = 0
foreach ($u in $urls) {
    $i++
    # Derive filename, dedupe collisions by prefixing parent folder when needed
    $uri = [Uri]$u
    $name = [System.IO.Path]::GetFileName($uri.LocalPath)
    $name = $name -replace '[^a-zA-Z0-9._-]', '_'
    $dest = Join-Path $out $name

    if (Test-Path $dest) {
        # If a different URL already wrote this filename, add a hash-prefixed copy
        if (-not $map.ContainsValue("assets/images/$name")) {
            $hash = ([Math]::Abs(($u.GetHashCode())) % 100000).ToString()
            $name = "$hash-$name"
            $dest = Join-Path $out $name
        }
    }

    if (-not (Test-Path $dest)) {
        try {
            Invoke-WebRequest -Uri $u -OutFile $dest -TimeoutSec 25 -UseBasicParsing -ErrorAction Stop
            Write-Host ("[{0}/{1}] OK   {2}" -f $i, $urls.Count, $name)
        } catch {
            Write-Host ("[{0}/{1}] FAIL {2}  ({3})" -f $i, $urls.Count, $u, $_.Exception.Message)
            continue
        }
    } else {
        Write-Host ("[{0}/{1}] SKIP {2}" -f $i, $urls.Count, $name)
    }

    $map[$u] = "assets/images/$name"
}

$map | ConvertTo-Json -Depth 3 | Set-Content -Path $manifest -Encoding utf8
Write-Host ("Manifest written: {0}" -f $manifest)
Write-Host ("Downloaded {0} assets" -f $map.Count)
