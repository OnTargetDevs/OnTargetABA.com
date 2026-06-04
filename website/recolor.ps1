# Sweep all HTML files and replace any old palette hex values with the new On Target ABA brand palette.
# Idempotent — safe to run multiple times.

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$swaps = @{
  '#0B2233' = '#1B2733'   # ink
  '#0b2233' = '#1B2733'
  '#1F3A52' = '#34495E'   # ink-soft
  '#1f3a52' = '#34495E'
  '#0E4D6E' = '#00B7EA'   # teal primary
  '#0e4d6e' = '#00B7EA'
  '#0A3A55' = '#009EC3'   # teal deep
  '#0a3a55' = '#009EC3'
  '#DCEBF4' = '#D6F0F8'   # teal soft
  '#dcebf4' = '#D6F0F8'
  '#FF6B47' = '#FF6900'   # coral
  '#ff6b47' = '#FF6900'
  '#FF855F' = '#FF8429'   # coral hover
  '#ff855f' = '#FF8429'
  '#FFE3D7' = '#FFE0CC'   # coral soft
  '#ffe3d7' = '#FFE0CC'
  '#FFC857' = '#FFDD17'   # sun
  '#ffc857' = '#FFDD17'
  '#FFD377' = '#FFE752'   # sun hover
  '#ffd377' = '#FFE752'
  '#FFF1CF' = '#FFF6C8'   # sun soft
  '#fff1cf' = '#FFF6C8'
  '#FAF7F2' = '#EEEADD'   # cream
  '#faf7f2' = '#EEEADD'
  '#FFFCF6' = '#FBF8EE'   # cream-tint
  '#fffcf6' = '#FBF8EE'
  '#E4ECF2' = '#E2E0D4'   # line
  '#e4ecf2' = '#E2E0D4'
}

# Also rebuild the bullseye gradient strings (multi-arg substitutions)
$gradientSwaps = @{
  '#FF6B47 0 22%, #fff 22% 38%, #0E4D6E 38% 54%, #fff 54% 70%, #0A3A55 70%' = '#FF6900 0 22%, #fff 22% 38%, #FFDD17 38% 54%, #fff 54% 70%, #00B7EA 70%'
}

$files = @()
$files += Get-ChildItem -Path $root -Filter *.html -File
$files += Get-ChildItem -Path (Join-Path $root 'assets\css') -Filter *.css -File -ErrorAction SilentlyContinue
$svgs = Get-ChildItem -Path (Split-Path $root -Parent) -Filter *.svg -File -ErrorAction SilentlyContinue
$files += $svgs

$changed = 0
foreach ($f in $files) {
    $c = Get-Content $f.FullName -Raw
    $orig = $c
    foreach ($k in $gradientSwaps.Keys) { $c = $c.Replace($k, $gradientSwaps[$k]) }
    foreach ($k in $swaps.Keys)         { $c = $c.Replace($k, $swaps[$k]) }
    if ($c -ne $orig) {
        Set-Content -Path $f.FullName -Value $c -Encoding utf8 -NoNewline
        $changed++
        Write-Host ("recolored: {0}" -f $f.Name)
    }
}
Write-Host ("Done. {0} files updated." -f $changed)
