<#
Rebuild one Illustrator artwork natively and check it against the designer's PNG export, in one go:
  powershell -File rebuild_check.ps1 -Src "D:/.../5_A Single Window system.svg" -Work "D:/.../_build/rebuild/S09" -Comp "S09 Single Window REBUILT" -Duration <scene s> [-Fps 24] [-Replace 9878 -MainId 8812]
-Src takes the SVG export (preferred) or the .ai; given an .ai with a same-named .svg beside it, the SVG is used.
Writes in -Work: elements.json, img_*.png, reference.png, layers.json, compare.png (the PNG export next to the
.ai when there is one, else reference.png, on top;
rebuild below) and prints the share of differing pixels. With -Replace/-MainId the rebuilt comp is swapped into
the main comp in place of comp <Replace> (timing/scale kept; the old comp is moved to "Replaced AI scenes").
#>
param(
    [Parameter(Mandatory = $true)][Alias("Ai", "Svg")][string]$Src,
    [Parameter(Mandatory = $true)][string]$Work,
    [Parameter(Mandatory = $true)][string]$Comp,
    [int]$Fps = 24, [double]$Duration = 0, [int]$Replace = 0, [int]$MainId = 0, [double]$CheckTime = 5
)
$ErrorActionPreference = "Stop"
if ($Duration -le 0 -and $Replace -le 0) { Write-Output "ERROR: give -Duration <scene length in s> (or -Replace <placed comp id> to take that comp's length)"; exit 1 }
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
New-Item -ItemType Directory -Force $Work | Out-Null
$wf = $Work -replace '\\', '/'
$svg = [IO.Path]::ChangeExtension($Src, ".svg")
if ($Src -match '\.ai$' -and (Test-Path $svg)) { Write-Output "using the SVG export: $svg"; $Src = $svg }
if ($Src -match '\.svg$') { python "$here/svg_extract.py" $Src $Work } else { python "$here/ai_extract.py" $Src $Work }
if ($LASTEXITCODE -ne 0) { Write-Output "ERROR: extraction failed"; exit 1 }
$cfg = @{ elements = "$wf/elements.json"; comp = $Comp; fps = $Fps; folder = "Rebuilt AI scenes"; layersOut = "$wf/layers.json"; fontMap = @{ "AfacadFlux-Regular" = "Afacad-Regular" } }
if ($Duration -gt 0) { $cfg.duration = $Duration }   # else rebuild_ai takes the replaced comp's length
if ($Replace -gt 0) { $cfg.replace = $Replace; $cfg.mainId = $MainId; $cfg.keepOld = "Replaced AI scenes" }
$cfg | ConvertTo-Json -Depth 4 | Out-File -Encoding ascii "$Work/rebuild.json"
$o = (powershell -NoProfile -ExecutionPolicy Bypass -File "$here/ae_run.ps1" -Script "jsx/rebuild_ai.jsx" -DataFile "$Work/rebuild.json" -Timeout 300) -join ""
Write-Output $o
$id = [regex]::Match($o, 'compId:(\d+)').Groups[1].Value
if (-not $id) { Write-Output "ERROR: rebuild failed"; exit 1 }
$qd = "$wf/qc_rebuild_" + (Get-Date -Format "HHmmss")   # fresh folder: AE will not overwrite an existing frame
"{`"compId`":$id,`"times`":[$CheckTime],`"outDir`":`"$qd`",`"prefix`":`"RB`"}" | Out-File -Encoding ascii "$Work/qc.json"
$r = (powershell -NoProfile -ExecutionPolicy Bypass -File "$here/ae_run.ps1" -Script "jsx/qc_frames.jsx" -DataFile "$Work/qc.json" -Timeout 180) -join ""
$f = [regex]::Match($r, 'files:\["([^"]+)"').Groups[1].Value -replace '\\\\', '\'
# the designer's PNG export is the design of record (the .ai's PDF stream can be stale); else the PDF render
$png = [IO.Path]::ChangeExtension($Src, ".png")
$ref = if (Test-Path $png) { $png } elseif (Test-Path "$Work/reference.png") { "$Work/reference.png" } else { "" }
if ($ref) { Write-Output "reference: $ref"; python "$here/compare_render.py" $ref $f "$Work/compare.png" }
else { Write-Output "no PNG export to compare with: check the rendered frame by eye: $f" }
Write-Output "compId: $id"
