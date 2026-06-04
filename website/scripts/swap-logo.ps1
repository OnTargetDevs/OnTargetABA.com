# Replace the placeholder bullseye+wordmark with the real On Target ABA logo
# across every HTML page in the project. Idempotent.

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$pages = Get-ChildItem -Path $root -Filter *.html -File

# Nav placeholder -> real logo (matches both old palette and new palette variants)
$navOld_new = @'
<a href="index.html" class="flex items-center gap-2.5 group">
      <span class="relative inline-grid place-items-center w-10 h-10 rounded-full bg-white shadow ring-1 ring-line">
        <span class="block w-7 h-7 rounded-full" style="background:radial-gradient(circle at center, #FF6900 0 22%, #fff 22% 38%, #FFDD17 38% 54%, #fff 54% 70%, #00B7EA 70%)"></span>
      </span>
      <span class="leading-tight">
        <span class="block font-extrabold tracking-tight text-ink">On Target<span class="text-coral">.</span></span>
        <span class="block text-[10px] tracking-[0.22em] text-mute font-semibold">A B A &nbsp; T H E R A P Y</span>
      </span>
    </a>
'@

$navOld_old = @'
<a href="index.html" class="flex items-center gap-2.5 group">
      <span class="relative inline-grid place-items-center w-10 h-10 rounded-full bg-white shadow ring-1 ring-line">
        <span class="block w-7 h-7 rounded-full" style="background:radial-gradient(circle at center, #FF6B47 0 22%, #fff 22% 38%, #0E4D6E 38% 54%, #fff 54% 70%, #0A3A55 70%)"></span>
      </span>
      <span class="leading-tight">
        <span class="block font-extrabold tracking-tight text-ink">On Target<span class="text-coral">.</span></span>
        <span class="block text-[10px] tracking-[0.22em] text-mute font-semibold">A B A &nbsp; T H E R A P Y</span>
      </span>
    </a>
'@

$navNew = @'
<a href="index.html" class="flex items-center group" aria-label="On Target ABA — home">
      <img src="assets/images/footerImg.png" alt="On Target ABA" class="h-10 w-auto transition-transform group-hover:scale-[1.02]" />
    </a>
'@

# Footer placeholder -> real logo
$footOld_new = @'
<div class="flex items-center gap-2.5">
        <span class="inline-grid place-items-center w-10 h-10 rounded-full bg-white">
          <span class="block w-7 h-7 rounded-full" style="background:radial-gradient(circle at center, #FF6900 0 22%, #fff 22% 38%, #FFDD17 38% 54%, #fff 54% 70%, #00B7EA 70%)"></span>
        </span>
        <span class="font-extrabold">On Target ABA</span>
      </div>
'@

$footOld_old = @'
<div class="flex items-center gap-2.5">
        <span class="inline-grid place-items-center w-10 h-10 rounded-full bg-white">
          <span class="block w-7 h-7 rounded-full" style="background:radial-gradient(circle at center, #FF6B47 0 22%, #fff 22% 38%, #0E4D6E 38% 54%, #fff 54% 70%, #0A3A55 70%)"></span>
        </span>
        <span class="font-extrabold">On Target ABA</span>
      </div>
'@

$footNew = @'
<div class="flex items-center">
        <img src="assets/images/footerImg.png" alt="On Target ABA" class="h-11 w-auto" />
      </div>
'@

$changed = 0
foreach ($p in $pages) {
    $c = Get-Content $p.FullName -Raw
    $orig = $c
    $c = $c.Replace($navOld_new, $navNew)
    $c = $c.Replace($navOld_old, $navNew)
    $c = $c.Replace($footOld_new, $footNew)
    $c = $c.Replace($footOld_old, $footNew)
    if ($c -ne $orig) {
        Set-Content -Path $p.FullName -Value $c -Encoding utf8 -NoNewline
        $changed++
        Write-Host ("logo-swapped: {0}" -f $p.Name)
    }
}
Write-Host ("Done. {0} files updated." -f $changed)
