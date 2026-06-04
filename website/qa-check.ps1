# QA sweep across all generated HTML files.
# Checks: broken local links, missing local images, leftover old palette hex values.

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$pages = Get-ChildItem -Path $root -Filter *.html -File
$imageDir = Join-Path $root 'assets\images'
$existingPages = $pages.Name + 'index.html' | Sort-Object -Unique
$existingImages = Get-ChildItem -Path $imageDir -File | ForEach-Object { $_.Name }

$oldHex = @('#0B2233','#0E4D6E','#0A3A55','#DCEBF4','#FF6B47','#FFC857','#FAF7F2')

$brokenLinks = @()
$missingImages = @()
$staleColors = @()

foreach ($p in $pages) {
    $c = Get-Content $p.FullName -Raw

    # local html links: href="something.html" (skip external + anchors)
    foreach ($m in [regex]::Matches($c, 'href="([a-zA-Z0-9_-]+\.html)(?:#[^"]*)?"')) {
        $target = $m.Groups[1].Value
        if ($existingPages -notcontains $target) {
            $brokenLinks += "$($p.Name) → $target"
        }
    }

    # image refs: src="assets/images/..."
    foreach ($m in [regex]::Matches($c, 'src="assets/images/([^"]+)"')) {
        $img = $m.Groups[1].Value
        if ($existingImages -notcontains $img) {
            $missingImages += "$($p.Name) → $img"
        }
    }

    # old palette leftover
    foreach ($h in $oldHex) {
        if ($c.IndexOf($h, [StringComparison]::OrdinalIgnoreCase) -ge 0) {
            $staleColors += "$($p.Name) contains $h"
        }
    }
}

Write-Host ("=== QA report ===")
Write-Host ("Pages checked: {0}" -f $pages.Count)
Write-Host ("Images available: {0}" -f $existingImages.Count)
Write-Host ""
Write-Host ("Broken local links: {0}" -f $brokenLinks.Count)
$brokenLinks | Select-Object -Unique | ForEach-Object { Write-Host ("  - {0}" -f $_) }
Write-Host ""
Write-Host ("Missing images: {0}" -f $missingImages.Count)
$missingImages | Select-Object -Unique | ForEach-Object { Write-Host ("  - {0}" -f $_) }
Write-Host ""
Write-Host ("Stale palette mentions: {0}" -f $staleColors.Count)
$staleColors | Select-Object -Unique | ForEach-Object { Write-Host ("  - {0}" -f $_) }
