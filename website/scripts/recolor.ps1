# Sweep all HTML/CSS/SVG and map every known legacy palette hex value to
# the current Figma-aligned On Target ABA brand palette.
# PowerShell hashtable comparison is case-insensitive, so each hex appears
# once and matches both #AABBCC and #aabbcc occurrences in the source.
# Idempotent. Safe to run as many times as needed.

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

# Current Figma palette (target values — see CLAUDE.md for the canonical reference):
#   ink       #163243    ink-soft  #34495E
#   teal      #00B7EA    teal-deep #0E5E6E    teal-soft #D6F0F8
#   coral     #E84F3B    coral-soft #FCE0DA
#   sun       #F4C842    sun-soft  #FFF1C2
#   sage      #C5E0D5    sage-soft #E6F1EB
#   cream     #FAF5E6    line      #E8DFD0    mute #6B7E8F

$swaps = @{
  # ink (legacy + intermediate -> Figma)
  '#0B2233' = '#163243'
  '#1B2733' = '#163243'

  # ink-soft (unchanged from intermediate; legacy maps here)
  '#1F3A52' = '#34495E'

  # teal-deep (legacy primary + intermediate -> Figma deep teal)
  '#0E4D6E' = '#0E5E6E'
  '#0A3A55' = '#0E5E6E'
  '#009EC3' = '#0E5E6E'

  # teal-soft
  '#DCEBF4' = '#D6F0F8'

  # coral
  '#FF6B47' = '#E84F3B'
  '#FF6900' = '#E84F3B'

  # coral hover
  '#FF855F' = '#F26A57'
  '#FF8429' = '#F26A57'

  # coral soft
  '#FFE3D7' = '#FCE0DA'
  '#FFE0CC' = '#FCE0DA'

  # sun
  '#FFC857' = '#F4C842'
  '#FFDD17' = '#F4C842'

  # sun hover
  '#FFD377' = '#FFD75E'
  '#FFE752' = '#FFD75E'

  # sun soft
  '#FFF1CF' = '#FFF1C2'
  '#FFF6C8' = '#FFF1C2'

  # cream
  '#FAF7F2' = '#FAF5E6'
  '#EEEADD' = '#FAF5E6'
  '#FFFCF6' = '#FDFAEF'
  '#FBF8EE' = '#FDFAEF'

  # line
  '#E4ECF2' = '#E8DFD0'
  '#E2E0D4' = '#E8DFD0'
}

# Bullseye-logo gradient strings (multi-arg substitutions in inline styles).
# Different legacy variants all collapse onto the same Figma gradient.
$gradientSwaps = @{
  '#FF6B47 0 22%, #fff 22% 38%, #0E4D6E 38% 54%, #fff 54% 70%, #0A3A55 70%' = '#E84F3B 0 22%, #fff 22% 38%, #F4C842 38% 54%, #fff 54% 70%, #00B7EA 70%'
  '#FF6900 0 22%, #fff 22% 38%, #FFDD17 38% 54%, #fff 54% 70%, #00B7EA 70%' = '#E84F3B 0 22%, #fff 22% 38%, #F4C842 38% 54%, #fff 54% 70%, #00B7EA 70%'
}

$files = @()
$files += Get-ChildItem -Path $root -Filter *.html -File
$files += Get-ChildItem -Path (Join-Path $root 'blog') -Filter *.html -File -ErrorAction SilentlyContinue
$files += Get-ChildItem -Path (Join-Path $root 'assets\css') -Filter *.css -File -ErrorAction SilentlyContinue
$files += Get-ChildItem -Path (Join-Path $root 'assets\js') -Filter *.js -File -ErrorAction SilentlyContinue
$svgs = Get-ChildItem -Path (Split-Path $root -Parent) -Filter *.svg -File -ErrorAction SilentlyContinue
$files += $svgs

# Build a case-insensitive Regex pattern so #abcdef matches just like #ABCDEF.
# This avoids relying on .Replace's case-sensitive behavior.
$rxOptions = [System.Text.RegularExpressions.RegexOptions]::IgnoreCase

$changed = 0
foreach ($f in $files) {
    # Preserve UTF-8 BOM via byte-level IO so the encoding fix isn't undone.
    $bytes = [System.IO.File]::ReadAllBytes($f.FullName)
    $hadBom = $bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF
    if ($hadBom) { $bytes = $bytes[3..($bytes.Length - 1)] }
    $c = [System.Text.Encoding]::UTF8.GetString($bytes)
    $orig = $c

    foreach ($k in $gradientSwaps.Keys) {
        $c = [System.Text.RegularExpressions.Regex]::Replace($c, [Regex]::Escape($k), $gradientSwaps[$k], $rxOptions)
    }
    foreach ($k in $swaps.Keys) {
        $c = [System.Text.RegularExpressions.Regex]::Replace($c, [Regex]::Escape($k), $swaps[$k], $rxOptions)
    }

    if ($c -ne $orig) {
        $bom = [byte[]](0xEF, 0xBB, 0xBF)
        $out = $bom + [System.Text.Encoding]::UTF8.GetBytes($c)
        [System.IO.File]::WriteAllBytes($f.FullName, $out)
        $changed++
        Write-Host ("recolored: {0}" -f $f.Name)
    }
}
Write-Host ("Done. {0} files updated." -f $changed)
