# Robust UTF-8 fix for all HTML files in the project.
# Source is pure ASCII; special chars are built from code points so this
# script can be re-saved by any encoding without breaking.
# Idempotent.

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$pages = Get-ChildItem -Path $root -Filter *.html -File

# Build special chars from code points (ASCII-safe source)
$rarr  = [string][char]0x2192   # right arrow
$larr  = [string][char]0x2190   # left arrow
$uarr  = [string][char]0x2191   # up arrow
$darr  = [string][char]0x2193   # down arrow
$hell  = [string][char]0x2026   # ellipsis
$mdash = [string][char]0x2014   # em dash
$ndash = [string][char]0x2013   # en dash
$ldq   = [string][char]0x201C   # left double quote
$rdq   = [string][char]0x201D   # right double quote
$lsq   = [string][char]0x2018   # left single quote
$rsq   = [string][char]0x2019   # right single quote
$mid   = [string][char]0x00B7   # middle dot
$copy  = [string][char]0x00A9   # copyright
$reg   = [string][char]0x00AE   # registered
$bull  = [string][char]0x2022   # bullet
$deg   = [string][char]0x00B0   # degree
$nbsp  = [string][char]0x00A0   # nbsp
$chk   = [string][char]0x2713   # check mark
$cross = [string][char]0x2717   # ballot x
$star  = [string][char]0x2605   # star

# Mojibake decode: UTF-8 bytes read as Latin-1 yields these sequences.
# Compute the misread form by encoding the unicode char as UTF-8, then
# decoding those bytes as Latin-1 (Windows-1252).
function Get-Moji {
    param([string] $u)
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($u)
    return [System.Text.Encoding]::GetEncoding(1252).GetString($bytes)
}

# Order matters: do mojibake-decode pass first (longer sequences first),
# then replace correct chars with HTML entities.
$mojiTargets = @(
    @{ moji = (Get-Moji $hell);  fix = $hell },
    @{ moji = (Get-Moji $mdash); fix = $mdash },
    @{ moji = (Get-Moji $ndash); fix = $ndash },
    @{ moji = (Get-Moji $rdq);   fix = $rdq },
    @{ moji = (Get-Moji $ldq);   fix = $ldq },
    @{ moji = (Get-Moji $rsq);   fix = $rsq },
    @{ moji = (Get-Moji $lsq);   fix = $lsq },
    @{ moji = (Get-Moji $rarr);  fix = $rarr },
    @{ moji = (Get-Moji $larr);  fix = $larr },
    @{ moji = (Get-Moji $uarr);  fix = $uarr },
    @{ moji = (Get-Moji $darr);  fix = $darr },
    @{ moji = (Get-Moji $bull);  fix = $bull },
    @{ moji = (Get-Moji $mid);   fix = $mid },
    @{ moji = (Get-Moji $copy);  fix = $copy },
    @{ moji = (Get-Moji $reg);   fix = $reg },
    @{ moji = (Get-Moji $deg);   fix = $deg },
    @{ moji = (Get-Moji $nbsp);  fix = ' ' },
    @{ moji = (Get-Moji $chk);   fix = $chk },
    @{ moji = (Get-Moji $cross); fix = $cross },
    @{ moji = (Get-Moji $star);  fix = $star }
)

# After de-mojibake-ing, swap the actual chars for HTML entities so the
# rendered HTML is byte-safe even if some downstream tool guesses wrong.
$entities = @(
    @{ ch = $rarr;  ent = '&rarr;' },
    @{ ch = $larr;  ent = '&larr;' },
    @{ ch = $uarr;  ent = '&uarr;' },
    @{ ch = $darr;  ent = '&darr;' },
    @{ ch = $hell;  ent = '&hellip;' },
    @{ ch = $mdash; ent = '&mdash;' },
    @{ ch = $ndash; ent = '&ndash;' },
    @{ ch = $ldq;   ent = '&ldquo;' },
    @{ ch = $rdq;   ent = '&rdquo;' },
    @{ ch = $lsq;   ent = '&lsquo;' },
    @{ ch = $rsq;   ent = '&rsquo;' },
    @{ ch = $mid;   ent = '&middot;' },
    @{ ch = $copy;  ent = '&copy;' },
    @{ ch = $reg;   ent = '&reg;' },
    @{ ch = $bull;  ent = '&bull;' },
    @{ ch = $deg;   ent = '&deg;' },
    @{ ch = $chk;   ent = '&#10003;' },
    @{ ch = $cross; ent = '&#10007;' },
    @{ ch = $star;  ent = '&#9733;' }
)

$bom = [byte[]](0xEF, 0xBB, 0xBF)
$changed = 0

foreach ($p in $pages) {
    # Read raw bytes, strip leading BOM if present, decode as UTF-8
    $bytes = [System.IO.File]::ReadAllBytes($p.FullName)
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
        $bytes = $bytes[3..($bytes.Length - 1)]
    }
    $c = [System.Text.Encoding]::UTF8.GetString($bytes)
    $orig = $c

    # Pass 1: decode any mojibake sequences (longest-first for substring safety)
    foreach ($m in $mojiTargets) {
        if ($m.moji -ne $m.fix) {
            $c = $c.Replace($m.moji, $m.fix)
        }
    }
    # Pass 2: convert correct chars to HTML entities
    foreach ($e in $entities) {
        $c = $c.Replace($e.ch, $e.ent)
    }

    if ($c -ne $orig) { $changed++ }

    # Re-save with UTF-8 BOM so the encoding cannot be misread
    $newBytes = $bom + [System.Text.Encoding]::UTF8.GetBytes($c)
    [System.IO.File]::WriteAllBytes($p.FullName, $newBytes)
}

Write-Host ("Encoding-fixed: {0} of {1} files changed. All saved as UTF-8 with BOM." -f $changed, $pages.Count)
