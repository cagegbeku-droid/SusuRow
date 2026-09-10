Add-Type -AssemblyName System.Drawing

$baseDir = "C:\Users\cageg\.gemini\antigravity-ide\scratch\susurow\frontend\android\app\src\main\res"

$splashFiles = Get-ChildItem -Path $baseDir -Filter "splash.png" -Recurse

$tealBg = [System.Drawing.Color]::FromArgb(255, 0, 91, 82)       # #005B52
$darkTeal = [System.Drawing.Color]::FromArgb(255, 0, 54, 48)     # #003630
$gold = [System.Drawing.Color]::FromArgb(255, 245, 158, 11)      # #F59E0B
$cyan = [System.Drawing.Color]::FromArgb(255, 0, 242, 254)       # #00F2FE
$white = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)

foreach ($file in $splashFiles) {
    try {
        $orig = [System.Drawing.Image]::FromFile($file.FullName)
        $w = $orig.Width
        $h = $orig.Height
        $orig.Dispose()

        $bmp = New-Object System.Drawing.Bitmap($w, $h)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

        # Dark Teal background
        $bgBrush = New-Object System.Drawing.SolidBrush($tealBg)
        $g.FillRectangle($bgBrush, 0, 0, $w, $h)
        $bgBrush.Dispose()

        $cx = $w / 2.0
        $cy = $h / 2.0
        $r = [math]::Min($w, $h) * 0.16

        # Outer Gold Rotating Track
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

        # Cyan Ring
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

        $bmp.Save($file.FullName, [System.Drawing.Imaging.ImageFormat]::Png)
        $bmp.Dispose()
        Write-Host "Updated splash: $($file.FullName)"
    } catch {
        Write-Warning "Could not update $($file.FullName): $_"
    }
}
Write-Host "All splash screens updated!"
