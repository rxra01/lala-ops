# Zero-dependency PowerShell HTTP Server for Lala Ops
param([int]$Port = 3000)

$Prefix = "http://localhost:$Port/"
$Listener = New-Object System.Net.HttpListener
$Listener.Prefixes.Add($Prefix)

try {
    $Listener.Start()
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host " Lala Ops Server Running: $Prefix" -ForegroundColor Green
    Write-Host " Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host "=============================================" -ForegroundColor Cyan

    $BaseDir = $PSScriptRoot

    while ($Listener.IsListening) {
        $Context = $Listener.GetContext()
        $Request = $Context.Request
        $Response = $Context.Response

        $UrlPath = $Request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($UrlPath)) {
            $UrlPath = "index.html"
        }

        # Prevent directory traversal
        $CleanPath = $UrlPath.Replace('..', '').Replace('/', '\')
        $FilePath = Join-Path $BaseDir $CleanPath

        if (Test-Path $FilePath -PathType Leaf) {
            $Bytes = [System.IO.File]::ReadAllBytes($FilePath)
            
            # Content Types
            $Ext = [System.IO.Path]::GetExtension($FilePath).ToLower()
            $ContentType = switch ($Ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".json" { "application/json; charset=utf-8" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".jpeg" { "image/jpeg" }
                ".svg"  { "image/svg+xml" }
                default { "application/octet-stream" }
            }

            $Response.ContentType = $ContentType
            $Response.ContentLength64 = $Bytes.Length
            $Response.StatusCode = 200
            $Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
        } else {
            $Response.StatusCode = 404
            $NotFoundBytes = [System.Text.Encoding]::UTF8.GetBytes("File Not Found: $UrlPath")
            $Response.OutputStream.Write($NotFoundBytes, 0, $NotFoundBytes.Length)
        }

        $Response.OutputStream.Close()
    }
}
finally {
    $Listener.Stop()
    $Listener.Close()
}
