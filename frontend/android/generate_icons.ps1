Add-Type -AssemblyName System.Drawing

$baseDir = "C:\Users\cageg\.gemini\antigravity-ide\scratch\susurow\frontend\android\app\src\main\res"

$sizes = @(
    @{ Name = "mipmap-mdpi"; Size = 48; ForeSize = 108 },
    @{ Name = "mipmap-hdpi"; Size = 72; ForeSize = 162 },
    @{ Name = "mipmap-xhdpi"; Size = 96; ForeSize = 216 },
    @{ Name = "mipmap-xxhdpi"; Size = 144; ForeSize = 324 },
    @{ Name = "mipmap-xxxhdpi"; Size = 192; ForeSize = 432 }
)

$tealBg = [System.Drawing.Color]::FromArgb(255, 0, 91, 82)       # #005B52
$darkTeal = [System.Drawing.Color]::FromArgb(255, 0, 54, 48)     # #003630
$gold = [System.Drawing.Color]::FromArgb(255, 245, 158, 11)      # #F59E0B
$cyan = [System.Drawing.Color]::FromArgb(255, 0, 242, 254)       # #00F2FE
$transparent = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)

function Draw-SusuIcon($size, $isRound, $isForegroundOnly, $outputPath) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    if ($isForegroundOnly) {
        $g.Clear($transparent)
    } else {
        $g.Clear($transparent)
        $bgBrush = New-Object System.Drawing.SolidBrush($tealBg)
        if ($isRound) {
            $g.FillEllipse($bgBrush, 1, 1, $size - 2, $size - 2)
        } else {
            # Rounded rect
            $rect = New-Object System.Drawing.Rectangle(1, 1, $size - 2, $size - 2)
            $path = New-Object System.Drawing.Drawing2D.GraphicsPath
            $radius = [math]::Max(6, [math]::Round($size * 0.22))
            $d = $radius * 2
            $path.AddArc(1, 1, $d, $d, 180, 90)
            $path.AddArc($size - 1 - $d, 1, $d, $d, 270, 90)
            $path.AddArc($size - 1 - $d, $size - 1 - $d, $d, $d, 0, 90)
            $path.AddArc(1, $size - 1 - $d, $d, $d, 90, 90)
            $path.CloseFigure()
            $g.FillPath($bgBrush, $path)
            $path.Dispose()
        }
        $bgBrush.Dispose()
    }

    # Center coordinates & scale
    $cx = $size / 2.0
    $cy = $size / 2.0
    $r = if ($isForegroundOnly) { $size * 0.28 } else { $size * 0.40 }

    # Outer Gold Rotational Ring
    $outerPen = New-Object System.Drawing.Pen($gold, [math]::Max(2, [math]::Round($r * 0.12)))
    $outerPen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
    $outerR = $r * 0.88
    $g.DrawEllipse($outerPen, [float]($cx - $outerR), [float]($cy - $outerR), [float]($outerR * 2), [float]($outerR * 2))
    $outerPen.Dispose()

    # Inner Vault Dark Circle
    $innerR = $r * 0.65
    $innerBrush = New-Object System.Drawing.SolidBrush($darkTeal)
    $g.FillEllipse($innerBrush, [float]($cx - $innerR), [float]($cy - $innerR), [float]($innerR * 2), [float]($innerR * 2))
    $innerBrush.Dispose()

    # Cyan Accent Ring
    $cyanPen = New-Object System.Drawing.Pen($cyan, [math]::Max(1, [math]::Round($r * 0.05)))
    $g.DrawEllipse($cyanPen, [float]($cx - $innerR), [float]($cy - $innerR), [float]($innerR * 2), [float]($innerR * 2))
    $cyanPen.Dispose()

    # Cedi Symbol in center
    $fontSize = [math]::Max(10, [math]::Round($innerR * 1.35))
    $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold)
    $goldBrush = New-Object System.Drawing.SolidBrush($gold)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $g.DrawString([char]0x20B5, $font, $goldBrush, [float]$cx, [float]$cy, $sf)

    $font.Dispose()
    $goldBrush.Dispose()
    $sf.Dispose()
    $g.Dispose()

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated: $outputPath"
}

foreach ($item in $sizes) {
    $folder = Join-Path $baseDir $item.Name
    if (-not (Test-Path $folder)) { New-Item -ItemType Directory -Path $folder -Force }

    # 1. Standard square/rounded launcher icon
    $p1 = Join-Path $folder "ic_launcher.png"
    Draw-SusuIcon $item.Size $false $false $p1

    # 2. Round launcher icon
    $p2 = Join-Path $folder "ic_launcher_round.png"
    Draw-SusuIcon $item.Size $true $false $p2

    # 3. Adaptive foreground layer (larger safe zone)
    $p3 = Join-Path $folder "ic_launcher_foreground.png"
    Draw-SusuIcon $item.ForeSize $false $true $p3
}

Write-Host "All Android icons successfully generated!"
