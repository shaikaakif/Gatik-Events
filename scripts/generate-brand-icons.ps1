param(
  [string]$Source = "public/icons/gatik.jpg",
  [string]$OutputDirectory = "public/icons"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

if (-not (Test-Path -LiteralPath $Source)) {
  throw "Approved brand source is missing: $Source"
}

$sourceImage = [System.Drawing.Image]::FromFile((Resolve-Path -LiteralPath $Source))
if ($sourceImage.Width -lt 48 -or $sourceImage.Height -lt 48) {
  $sourceImage.Dispose()
  throw "Approved brand source is too small to generate icons safely."
}

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

function New-BrandPng {
  param(
    [int]$Size,
    [string]$Name,
    [double]$Scale = 1.0
  )

  $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
  $bitmap.SetResolution(96, 96)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear([System.Drawing.Color]::White)
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

  $drawSize = [int][Math]::Round($Size * $Scale)
  $x = [int](($Size - $drawSize) / 2)
  $y = [int](($Size - $drawSize) / 2)
  $graphics.DrawImage($sourceImage, $x, $y, $drawSize, $drawSize)
  $outputPath = Join-Path $OutputDirectory $Name
  $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}

try {
  New-BrandPng -Size 16 -Name "favicon-16.png"
  New-BrandPng -Size 32 -Name "favicon-32.png"
  New-BrandPng -Size 48 -Name "favicon-48.png"
  New-BrandPng -Size 180 -Name "apple-touch-icon.png"
  New-BrandPng -Size 192 -Name "icon-192.png"
  New-BrandPng -Size 512 -Name "icon-512.png"
  New-BrandPng -Size 512 -Name "icon-maskable-512.png" -Scale 0.78

  $faviconBitmap = New-Object System.Drawing.Bitmap((Join-Path $OutputDirectory "favicon-32.png"))
  $icon = [System.Drawing.Icon]::FromHandle($faviconBitmap.GetHicon())
  $stream = [System.IO.File]::Create((Join-Path $OutputDirectory "favicon.ico"))
  $icon.Save($stream)
  $stream.Dispose()
  $icon.Dispose()
  $faviconBitmap.Dispose()
}
finally {
  $sourceImage.Dispose()
}

Write-Output "Generated favicon and PWA icons from $Source"
