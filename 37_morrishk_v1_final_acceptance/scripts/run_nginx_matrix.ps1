<#
Round 37 - Nginx routing / protection matrix.
Records status codes and key response headers for the Nginx test instance.

Usage:
  powershell -ExecutionPolicy Bypass -File run_nginx_matrix.ps1 -BaseUrl http://127.0.0.1:8096
#>
param(
    [string]$BaseUrl = 'http://127.0.0.1:8096',
    [string]$NginxExe = 'D:\phpstudy_pro\Extensions\Nginx1.15.11\nginx.exe',
    [string]$PhpCgi = 'D:\phpstudy_pro\Extensions\php\php7.4.3nts\php-cgi.exe'
)

Write-Output '== versions =='
Write-Output ((cmd /c "`"$NginxExe`" -v 2>&1" | Out-String).Trim())
Write-Output ((& $PhpCgi -v 2>&1 | Out-String).Trim())

Write-Output ''
Write-Output '== routing matrix =='
$paths = @(
    '/',
    '/products.html',
    '/about.html',
    '/sitemap.xml',
    '/robots.txt',
    '/products.html/',
    '/download/24ggpujdNQulsi0_rNo5A4XM.txt',
    '/download/does-not-exist.txt',
    '/uploads/images/logo.png',
    '/runtime/logs/app.log',
    '/config/db.php',
    '/db/2026-11-24_cart_owner.sql',
    '/vendor/autoload.php',
    '/tests/probe.txt',
    '/no-such-page.html'
)
foreach ($p in $paths) {
    $r = curl.exe -s -o NUL -w '%{http_code}|%{size_download}|%{redirect_url}' "$BaseUrl$p"
    Write-Output ("{0,-46} => {1}" -f $p, $r)
}

Write-Output ''
Write-Output '== response headers (homepage) =='
curl.exe -s -D - -o NUL "$BaseUrl/" | Where-Object { $_ -match '^(HTTP/|Content-Type:|X-Content-Type-Options:)' }

Write-Output ''
Write-Output '== response headers (301 trailing slash) =='
curl.exe -s -D - -o NUL "$BaseUrl/products.html/" | Where-Object { $_ -match '^(HTTP/|Location:)' }

Write-Output ''
Write-Output '== response headers (sitemap.xml) =='
curl.exe -s -D - -o NUL "$BaseUrl/sitemap.xml" | Where-Object { $_ -match '^(HTTP/|Content-Type:)' }

Write-Output ''
Write-Output '== response headers (guest download, expect 403) =='
curl.exe -s -D - -o NUL "$BaseUrl/download/24ggpujdNQulsi0_rNo5A4XM.txt" | Where-Object { $_ -match '^(HTTP/|Content-Type:|X-Content-Type-Options:)' }

Write-Output ''
Write-Output 'DONE'
