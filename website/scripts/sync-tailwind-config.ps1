# Rewrite every page's inline Tailwind config so it matches the current
# Figma-aligned palette in assets/css/app.css. Idempotent.

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$pages = Get-ChildItem -Path $root -Filter *.html -File

$canonical = @'
tailwind.config = {
  theme: {
    extend: {
      colors: {
        ink:   { DEFAULT: '#163243', soft: '#34495E' },
        teal:  { DEFAULT: '#00B7EA', deep: '#0E5E6E', soft: '#D6F0F8' },
        coral: { DEFAULT: '#E84F3B', soft: '#FCE0DA' },
        sun:   { DEFAULT: '#F4C842', soft: '#FFF1C2' },
        sage:  { DEFAULT: '#C5E0D5', soft: '#E6F1EB' },
        cream: '#FAF5E6',
        mute:  '#6B7E8F',
        line:  '#E8DFD0'
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif']
      }
    }
  }
}
'@

# Regex to match any <script>tailwind.config = {...}</script> block
$pattern = '(?s)<script>\s*tailwind\.config\s*=\s*\{[\s\S]*?\}\s*</script>'
$replacement = "<script>`n" + $canonical + "`n</script>"

$changed = 0
foreach ($p in $pages) {
    # Read raw bytes, strip BOM if present
    $bytes = [System.IO.File]::ReadAllBytes($p.FullName)
    $hadBom = $bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF
    if ($hadBom) { $bytes = $bytes[3..($bytes.Length - 1)] }
    $text = [System.Text.Encoding]::UTF8.GetString($bytes)
    $orig = $text

    $text = [regex]::Replace($text, $pattern, [System.Text.RegularExpressions.Regex]::Escape($replacement).Replace('\$','$').Replace('\(','(').Replace('\)',')').Replace('\{','{').Replace('\}','}').Replace('\\','\').Replace('\.','.').Replace("\'","'"))
    # Above is finicky; use a simple direct replace via .Replace on the matched string instead
    $matches = [regex]::Matches($orig, $pattern)
    if ($matches.Count -gt 0) {
        $text = $orig
        foreach ($m in $matches) {
            $text = $text.Replace($m.Value, $replacement)
        }
    }

    if ($text -ne $orig) {
        $bom = [byte[]](0xEF, 0xBB, 0xBF)
        $out = $bom + [System.Text.Encoding]::UTF8.GetBytes($text)
        [System.IO.File]::WriteAllBytes($p.FullName, $out)
        $changed++
        Write-Host ("config-synced: {0}" -f $p.Name)
    }
}
Write-Host ("Done. {0}/{1} files updated." -f $changed, $pages.Count)
