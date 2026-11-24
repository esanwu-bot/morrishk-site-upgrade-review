# Round 36 regression helper (read-only GET matrix + URL checks)
# Usage: powershell -File round36_regression.ps1 -Base http://127.0.0.1:8095
param([string]$Base = 'http://127.0.0.1:8095')

$urls = @(
    @{ n = 'home';            u = "$Base/" },
    @{ n = 'product_index';   u = "$Base/products.html" },
    @{ n = 'category_list';   u = "$Base/big-categories/c-0-32/electronic-components.html" },
    @{ n = 'category_sub';    u = "$Base/sub-categories/c-0-3301/integrated-circuits.html" },
    @{ n = 'pdp_1';           u = "$Base/products/00000001/M4T28-BR12SH1.html" },
    @{ n = 'pdp_2';           u = "$Base/products/00000002/STM32F103C8T6.html" },
    @{ n = 'search';          u = "$Base/search.html?keyword=STM32" },
    @{ n = 'inquiry';         u = "$Base/shopping-cart.html" },
    @{ n = 'success';         u = "$Base/cart/success.html" },
    @{ n = 'invalid_pdp';     u = "$Base/products/00000099/NOPE.html" },
    @{ n = 'nonexistent';     u = "$Base/no-such-page.html" },
    @{ n = 'robots';          u = "$Base/robots.txt" },
    @{ n = 'sitemap';         u = "$Base/sitemap.xml" },
    @{ n = 'download_unauth'; u = "$Base/download/0123456789abcdef01234567.txt" }
)

foreach ($x in $urls) {
    $r = curl.exe -sS -o NUL -w "%{http_code}|%{size_download}" $x.u
    "{0}|{1}" -f $x.n, $r
}

# URL checks
$sm = curl.exe -sS "$Base/sitemap.xml"
"sitemap_formal=" + ($sm -match 'https://www\.morrishk\.net')
"sitemap_localhost=" + ($sm -match '127\.0\.0\.1')
"slash_301=" + (curl.exe -sS -o NUL -w "%{http_code}" "$Base/products.html/")

# CSRF checks (manual, need a session token):
# 1) curl -c jar.txt "$Base/shopping-cart.html"  -> extract name="_csrf" value="..."
# 2) POST without token  -> expect 400
# 3) POST with token     -> expect 200 + success text
