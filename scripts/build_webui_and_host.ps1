$ErrorActionPreference = "Stop"

function Fail {
  param([string]$Message)
  Write-Error $Message
  exit 1
}

function Run-Step {
  param(
    [string]$Label,
    [string]$Command,
    [string[]]$CommandArgs
  )
  Write-Host $Label
  & $Command @CommandArgs
  if ($LASTEXITCODE -ne 0) {
    Fail "$Label failed with exit code $LASTEXITCODE."
  }
}

$ceilProRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$ds4Root = "C:\Users\koii\Documents\Projects\ds4 2.0\DS4Windows-3.3.3"
$distPublic = Join-Path $ceilProRoot "dist\public"
$webUiDest = Join-Path $ds4Root "DS4Windows\WebUI"
$readmePath = Join-Path $webUiDest "README.md"

$nodeVersion = (& node -v).Trim()
$npmVersion = (& npm -v).Trim()
Write-Host "Node: $nodeVersion"
Write-Host "Npm: $npmVersion"
$arch = & node -p "process.arch"
Write-Host "Arch: $arch"

if ($arch -ne "x64") {
  Fail "ERROR: Node architecture must be x64. Detected '$arch'."
}

Set-Location $ceilProRoot

if (Test-Path (Join-Path $ceilProRoot "node_modules")) {
  Remove-Item -Recurse -Force (Join-Path $ceilProRoot "node_modules")
}
if (Test-Path (Join-Path $ceilProRoot "package-lock.json")) {
  Remove-Item -Force (Join-Path $ceilProRoot "package-lock.json")
}

Run-Step "npm cache clean --force" "npm" @("cache", "clean", "--force")
Run-Step "npm install" "npm" @("install")

$viteBase = "./"
$env:VITE_BASE = $viteBase
Run-Step "npm run build" "npm" @("run", "build")

$indexPath = Join-Path $distPublic "index.html"
if (-not (Test-Path $indexPath)) {
  Fail "Build output missing: $indexPath"
}

$readmeBefore = Test-Path $readmePath
if (-not $readmeBefore) {
  $readmeCandidates = @(
    (Join-Path -Path $ds4Root -ChildPath "DS4Windows\bin\x64\Debug\net8.0-windows\WebUI\README.md"),
    (Join-Path -Path $ds4Root -ChildPath "DS4Windows\bin\x64\Release\net8.0-windows\WebUI\README.md")
  )
  foreach ($candidate in $readmeCandidates) {
    if (Test-Path $candidate) {
      Copy-Item -Force $candidate $readmePath
      $readmeBefore = $true
      Write-Host "Seeded README.md from $candidate"
      break
    }
  }
  if (-not $readmeBefore) {
    Write-Host "README.md not found to seed before robocopy."
  }
}

$excludeFiles = @("README.md", ".gitkeep", "ceilpro_build.json")
Write-Host ("Robocopy excludes: " + ($excludeFiles -join ", "))
Write-Host ("Robocopy command: robocopy `"$distPublic`" `"$webUiDest`" /MIR /NFL /NDL /NP /R:1 /W:1 /XF " + ($excludeFiles -join " "))

$robocopyArgs = @($distPublic, $webUiDest, "/MIR", "/NFL", "/NDL", "/NP", "/R:1", "/W:1", "/XF")
$robocopyArgs += $excludeFiles
& robocopy @robocopyArgs
$robocode = $LASTEXITCODE
if ($robocode -ge 8) {
  Fail "Robocopy failed with exit code $robocode."
}

$readmeAfter = Test-Path $readmePath
if ($readmeBefore -and -not $readmeAfter) {
  Fail "README.md was removed by robocopy."
}

$destIndex = Join-Path $webUiDest "index.html"
if (-not (Test-Path $destIndex)) {
  Fail "Copy output missing: $destIndex"
}

$buildStampPath = Join-Path $webUiDest "ceilpro_build.json"
$buildStamp = [ordered]@{
  buildUtc = (Get-Date).ToUniversalTime().ToString("o")
  nodeVersion = $nodeVersion
  npmVersion = $npmVersion
  viteBase = $viteBase
  sourceDistPath = $distPublic
  targetWebUiPath = $webUiDest
}
$buildStamp | ConvertTo-Json -Depth 3 | Set-Content -Path $buildStampPath -Encoding utf8
if (-not (Test-Path $buildStampPath)) {
  Fail "Build stamp missing: $buildStampPath"
}

if (Get-Process -Name "DS4Windows" -ErrorAction SilentlyContinue) {
  Write-Warning "DS4Windows.exe is running. Close it and rerun this script."
  exit 1
}

& dotnet build "$ds4Root\DS4WindowsWPF.sln" -c Debug -p:Platform=x64
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host "Build completed successfully."
