$repoName = '/SHIGAO'

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:8000/')
$listener.Prefixes.Add("http://localhost:8000$repoName/")
$listener.Start()
Write-Host 'Server started at http://localhost:8000'
Write-Host "GitHub Pages 模拟路径: http://localhost:8000$repoName/"
Write-Host 'Press Ctrl+C to stop the server'

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    
    $path = $request.Url.LocalPath
    
    if ($path -eq '/' -or $path -eq "$repoName/") { 
        $path = '/index.html' 
    }
    
    if ($path.StartsWith($repoName)) {
        $path = $path.Substring($repoName.Length)
    }
    
    $filePath = Join-Path $PWD $path.TrimStart('/')
    
    if (Test-Path $filePath) {
        $content = [System.IO.File]::ReadAllBytes($filePath)
        $response.ContentLength64 = $content.Length
        
        $extension = [System.IO.Path]::GetExtension($filePath)
        switch ($extension) {
            '.html' { $response.ContentType = 'text/html; charset=utf-8' }
            '.css'  { $response.ContentType = 'text/css; charset=utf-8' }
            '.js'   { $response.ContentType = 'application/javascript; charset=utf-8' }
            default { $response.ContentType = 'application/octet-stream' }
        }
        
        $response.OutputStream.Write($content, 0, $content.Length)
    } else {
        $response.StatusCode = 404
        $errorMsg = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
        $response.ContentLength64 = $errorMsg.Length
        $response.OutputStream.Write($errorMsg, 0, $errorMsg.Length)
    }
    
    $response.Close()
}
