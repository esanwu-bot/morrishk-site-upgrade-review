# Composer 审计汇总（自动生成）

来源：`composer audit --format=json`（全部依赖）与 `--no-dev`，lock 于 2026-11-24T08:22:36+00:00

| 包 | 版本 | 类型 | 依赖 | 通告数 | 最严重 | 严重度分布 | 应用代码命中 |
|---|---|---|---|---|---|---|---|
| phpoffice/phpspreadsheet | 1.19.0 | runtime | transitive | 31 | critical | critical×2, high×17, medium×12 | no |
| firebase/php-jwt | v5.5.1 | runtime | transitive | 2 | critical | critical×1, low×1 | no |
| guzzlehttp/guzzle | 7.4.1 | runtime | transitive | 14 | high | high×6, medium×8 | yes |
| phpseclib/phpseclib | 3.0.37 | runtime | transitive | 6 | high | high×2, low×1, medium×2, unknown×1 | no |
| symfony/yaml | v7.4.1 | dev | transitive | 5 | high | high×1, low×3, unknown×1 | no |
| phpunit/phpunit | 11.2.6 | dev | transitive | 1 | high | high×1 | no |
| yiisoft/yii2 | 2.0.53 | runtime | direct | 1 | high | high×1 | yes |
| guzzlehttp/psr7 | 2.8.0 | runtime | transitive | 4 | medium | medium×4 | no |
| psy/psysh | v0.12.15 | dev | transitive | 1 | medium | medium×1 | no |
| yiisoft/yii2-gii | 2.2.4 | dev | direct | 1 | medium | medium×1 | yes |
| yiisoft/yii2-redis | 2.0.17 | runtime | direct | 1 | medium | medium×1 | no |
| league/flysystem | 1.1.9 | runtime | transitive | 1 | low | low×1 | no |
| symfony/dom-crawler | v7.4.1 | dev | transitive | 1 | low | low×1 | no |
| symfony/polyfill-intl-idn | v1.32.0 | runtime | transitive | 1 | low | low×1 | no |

## 逐条明细

| 包 | Advisory ID | CVE | 严重度 | 受影响版本 | 标题 |
|---|---|---|---|---|---|
| phpoffice/phpspreadsheet | PKSA-r15m-kszr-8n8q | CVE-2026-108360 | medium | <=1.30.6|>=2.0.0,<=2.1.18|>=2.2.0,<=2.4.7|>=3.3.0,<=3.10.7|>=4.0.0,<=5.9.0 | PhpSpreadsheet: SSRF whitelist bypass via unre-validated HTTP redirect in Drawing::setPath external image loading |
| phpoffice/phpspreadsheet | PKSA-dxd5-wy68-pq29 | CVE-2026-108359 | high | <=1.30.6|>=2.0.0,<=2.1.18|>=2.2.0,<=2.4.7|>=3.3.0,<=3.10.7|>=4.0.0,<=5.9.0 | PhpSpreadsheet ODS Reader: Unbounded number-rows-repeated → CPU & Memory Exhaustion (DoS) |
| phpoffice/phpspreadsheet | PKSA-96jv-mtjg-g2v8 | CVE-2026-108358 | high | <=1.30.6|>=2.0.0,<=2.1.18|>=2.2.0,<=2.4.7|>=3.3.0,<=3.10.7|>=4.0.0,<=5.9.0 | PhpSpreadsheet: XmlScanner Bypass via ISO-2022 Escape Sequences Allows XXE and Denial of Service |
| phpoffice/phpspreadsheet | PKSA-r22k-87hv-mfk4 | CVE-2026-59933 | high | <=1.30.5|>=2.0.0,<=2.1.17|>=2.2.0,<=2.4.6|>=3.3.0,<=3.10.6|>=4.0.0,<=5.8.0 | PHPSpreadsheet: XLS/OLE sector-chain self-loop causes memory exhaustion |
| phpoffice/phpspreadsheet | PKSA-m9cr-9614-rsf7 | CVE-2026-59932 | high | <=1.30.5|>=2.0.0,<=2.1.17|>=2.2.0,<=2.4.6|>=3.3.0,<=3.10.6|>=4.0.0,<=5.8.0 | PHPSpreadsheet: Gnumeric reader unbounded gzip expansion causes memory exhaustion |
| phpoffice/phpspreadsheet | PKSA-dqzt-yst9-1w9y | CVE-2026-59931 | high | <=1.30.5|>=2.0.0,<=2.1.17|>=2.2.0,<=2.4.6|>=3.3.0,<=3.10.6|>=4.0.0,<=5.8.0 | PHPSpreadsheet: SSRF bypass via HTTP redirect in WEBSERVICE() domain whitelist |
| phpoffice/phpspreadsheet | PKSA-x678-4z45-v3d5 | CVE-2026-45034 | critical | <=1.30.4 | PHPSpreadsheet has a patch bypass for CVE-2026-34084  |
| phpoffice/phpspreadsheet | PKSA-gz3f-3cz3-3wsw | CVE-2026-40902 | high | <=1.30.3|>=2.0.0,<=2.1.15|>=2.2.0,<=2.4.4|>=3.3.0,<=3.10.4|>=4.0.0,<=5.6.0 | PhpSpreadsheet has CPU Denial of Service via Unbounded Row Number in XLSX Row Dimensions |
| phpoffice/phpspreadsheet | PKSA-x13r-n4wc-4gcr | CVE-2026-40863 | high | <=1.30.5|>=2.0.0,<=2.1.15|>=2.2.0,<=2.4.4|>=3.3.0,<=3.10.4|>=4.0.0,<=5.6.0 | PhpSpreadsheet has CPU Denial of Service via Unbounded Row Index in SpreadsheetML XML Reader |
| phpoffice/phpspreadsheet | PKSA-8cfg-tzhf-fr83 | CVE-2026-34084 | critical | <=1.30.2|>=2.0.0,<=2.1.14|>=2.2.0,<=2.4.3|>=3.3.0,<=3.10.3|>=4.0.0,<=5.5.0 | PhpSpreadsheet has SSRF/RCE in IOFactory::load when $filename is user controlled |
| phpoffice/phpspreadsheet | PKSA-hznc-gbby-6w16 | CVE-2026-40296 | medium | <=1.30.3|>=2.0.0,<=2.1.15|>=2.2.0,<=2.4.4|>=3.3.0,<=3.10.4|>=4.0.0,<=5.6.0 | PhpSpreadsheet has XSS via number format code with @ text placeholder bypasses htmlspecialchars in HTML writer |
| phpoffice/phpspreadsheet | PKSA-jtdk-dcr5-f11n | CVE-2026-35453 | medium | <=1.30.3|>=2.0.0,<=2.1.15|>=2.2.0,<=2.4.4|>=3.3.0,<=3.10.4|>=4.0.0,<=5.6.0 | PhpSpreadsheet has XSS via NumberFormat @ Text Substitution in HTML Writer |
| phpoffice/phpspreadsheet | PKSA-64jn-3d9t-gncx | CVE-2025-54370 | high | <1.30.0|>=2.0.0,<2.1.0|>=2.1.0,<2.1.12|>=2.2.0,<2.3.0|>=2.3.0,<2.4.0|>=3.0.0,<3.10.0|>=4.0.0,<5.0.0 | PhpSpreadsheet vulnerable to SSRF when reading and displaying a processed HTML document in the browser |
| phpoffice/phpspreadsheet | PKSA-8b16-mcgz-h4cz | CVE-2025-23210 | medium | >=2.0.0,<2.1.8|>=2.2.0,<2.3.7|<1.29.9|>=3.0.0,<3.9.0 | PhpSpreadsheet allows bypassing of XSS sanitizer using the javascript protocol and special characters |
| phpoffice/phpspreadsheet | PKSA-s99r-9yxm-hjvt | CVE-2025-22131 | medium | >=2.2.0,<2.3.6|>=2.0.0,<2.1.7|<1.29.8|>=3.0.0,<3.8.0 | Cross-Site Scripting (XSS) vulnerability in generateNavigation() function in PhpSpreadsheet |
| phpoffice/phpspreadsheet | PKSA-7jd6-nb49-bz4v | CVE-2024-56412 | medium | >=2.2.0,<=2.3.4|>=2.0.0,<=2.1.5|<=1.29.6|>=3.0.0,<3.7.0 | PhpSpreadsheet allows bypass XSS sanitizer using the javascript protocol and special characters |
| phpoffice/phpspreadsheet | PKSA-nm34-xhtz-ww9p | CVE-2024-56411 | medium | >=2.2.0,<=2.3.4|>=2.0.0,<=2.1.5|<=1.29.6|>=3.0.0,<3.7.0 | PhpSpreadsheet has a Cross-Site Scripting (XSS) vulnerability of the hyperlink base in the HTML page header |
| phpoffice/phpspreadsheet | PKSA-4ckb-wpj6-c29d | CVE-2024-56410 | medium | >=2.2.0,<=2.3.4|>=2.0.0,<=2.1.5|<=1.29.6|>=3.0.0,<3.7.0 | PhpSpreadsheet has a Cross-Site Scripting (XSS) vulnerability in custom properties |
| phpoffice/phpspreadsheet | PKSA-ybqb-vyrq-8pdt | CVE-2024-56409 | high | >=2.2.0,<=2.3.4|>=2.0.0,<=2.1.5|<=1.29.6|>=3.0.0,<3.7.0 | PhpSpreadsheet allows unauthorized Reflected XSS in Currency.php file |
| phpoffice/phpspreadsheet | PKSA-285y-y5bt-kvd9 | CVE-2024-56366 | high | >=2.2.0,<=2.3.4|>=2.0.0,<=2.1.5|<=1.29.6|>=3.0.0,<3.7.0 | PhpSpreadsheet allows unauthorized Reflected XSS in the Accounting.php file |
| phpoffice/phpspreadsheet | PKSA-jw5c-q9nd-tzj9 | CVE-2024-56365 | high | >=2.2.0,<=2.3.4|>=2.0.0,<=2.1.5|<=1.29.6|>=3.0.0,<3.7.0 | PhpSpreadsheet allows unauthorized Reflected XSS in the constructor of the Downloader class |
| phpoffice/phpspreadsheet | PKSA-bcnb-9tc9-bjb8 | CVE-2024-56408 | high | >=2.2.0,<=2.3.4|>=2.0.0,<=2.1.5|<=1.29.6|>=3.0.0,<3.7.0 | PhpSpreadsheet allows unauthorized Reflected XSS in `Convert-Online.php` file |
| phpoffice/phpspreadsheet | PKSA-gst3-cdk3-bpqt | CVE-2024-48917 | high | >=3.3.0,<3.4.0|>=2.2.0,<2.3.2|>=2.0.0,<2.1.3|<1.29.4 | XXE in PHPSpreadsheet's XLSX reader |
| phpoffice/phpspreadsheet | PKSA-dbrb-pvhs-h3st | CVE-2024-47873 | high | >=3.3.0,<3.4.0|>=2.2.0,<2.3.2|>=2.0.0,<2.1.3|<1.29.4 | XmlScanner bypass leads to XXE |
| phpoffice/phpspreadsheet | PKSA-mkg2-1wyw-57y7 | CVE-2024-45293 | high | >=2.0.0,<2.1.1|<1.29.1|>=2.2.0,<2.3.0 | XXE in PHPSpreadsheet's XLSX reader |
| phpoffice/phpspreadsheet | PKSA-p1pj-q951-6f1x | CVE-2024-45292 | medium | >=2.0.0,<2.1.1|<1.29.2|>=2.2.0,<2.3.0 | PhpSpreadsheet HTML writer is vulnerable to Cross-Site Scripting via JavaScript hyperlinks |
| phpoffice/phpspreadsheet | PKSA-7f9v-sb8k-krfb | CVE-2024-45291 | medium | >=2.0.0,<2.1.1|<1.29.2|>=2.2.0,<2.3.0 | PhpSpreadsheet allows absolute path traversal and Server-Side Request Forgery in HTML writer when embedding images is enabled |
| phpoffice/phpspreadsheet | PKSA-xk3k-rd1m-pxmg | CVE-2024-45290 | high | >=2.0.0,<2.1.1|<1.29.2|>=2.2.0,<2.3.0 | PhpSpreadsheet allows absolute path traversal and Server-Side Request Forgery when opening XLSX file |
| phpoffice/phpspreadsheet | PKSA-dvbq-8ft2-ngrw | CVE-2024-45060 | medium | >=2.0.0,<2.1.1|<1.29.2|>=2.2.0,<2.3.0 | PhpSpreadsheet has an Unauthenticated Cross-Site-Scripting (XSS) in sample file |
| phpoffice/phpspreadsheet | PKSA-xp7t-fbrb-qjv4 | CVE-2024-45048 | high | >=2.0.0,<2.1.1|>=2.2.0,<2.2.1|<1.29.1 | XXE in PHPSpreadsheet encoding is returned |
| phpoffice/phpspreadsheet | PKSA-m4hk-rk8p-4t5p | CVE-2024-45046 | medium | <1.29.1|>=2.0.0,<2.1.0 | PhpSpreadsheet HTML writer is vulnerable to Cross-Site Scripting via style information |
| firebase/php-jwt | PKSA-y2cr-5h3j-g3ys | CVE-2025-45769 | low | <7.0.0 | php-jwt contains weak encryption |
| firebase/php-jwt | PKSA-2kqm-ps5x-s4f5 | CVE-2021-46743 | critical | <6.0.0 | Key/algorithm type confusion |
| guzzlehttp/guzzle | PKSA-gcrk-3vtt-1r14 | CVE-2026-69246 | high | >=8.0.0,<8.0.1|<7.15.2 | Guzzle: Noncanonical host can bypass host-based checks |
| guzzlehttp/guzzle | PKSA-cnw1-2ytm-cgr8 | CVE-2026-69245 | medium | >=8.0.0,<8.0.1|<7.15.2 | Guzzle: Noncanonical cookie domain keeps subdomain scope |
| guzzlehttp/guzzle | PKSA-fy2t-3c5f-827y | CVE-2026-67354 | medium | <7.15.1 | Guzzle: URI fragments disclosed in redirect Referer headers |
| guzzlehttp/guzzle | PKSA-qxvb-2bpp-dnk6 | CVE-2026-67355 | medium | <7.15.1 | Guzzle: Host-only cookie scope is not preserved |
| guzzlehttp/guzzle | PKSA-bbs6-q5q9-f3t4 | CVE-2026-67353 | medium | <7.15.1 | Guzzle: Unbounded response cookies risk denial of service |
| guzzlehttp/guzzle | PKSA-bcdd-5xc7-gwfb | CVE-2026-59883 | medium | <7.12.3 | Guzzle: Cookie Disclosure and Injection via IP-Address Domains |
| guzzlehttp/guzzle | PKSA-pwsk-hy21-4gby | CVE-2026-67339 | medium | <7.14.2 | Guzzle: Proxy-Authorization headers can be sent to origin servers |
| guzzlehttp/guzzle | PKSA-93qv-9n9h-6k6p | CVE-2026-55767 | medium | <7.12.1 | Dot-only cookie domains match all hosts |
| guzzlehttp/guzzle | PKSA-k22t-f949-t9g6 | CVE-2026-55568 | medium | <7.12.1 | Silent HTTPS proxy downgrade to cleartext |
| guzzlehttp/guzzle | PKSA-yfw5-9gnj-n2c7 | CVE-2022-31091 | high | >=7,<7.4.5|>=4,<6.5.8 | Change in port should be considered a change in origin |
| guzzlehttp/guzzle | PKSA-k1b4-kshy-xgbh | CVE-2022-31090 | high | >=7,<7.4.5|>=4,<6.5.8 | CURLOPT_HTTPAUTH option not cleared on change of origin |
| guzzlehttp/guzzle | PKSA-2z36-j4q9-rsfy | CVE-2022-31043 | high | >=7,<7.4.4|>=4,<6.5.7 | Fix failure to strip Authorization header on HTTP downgrade |
| guzzlehttp/guzzle | PKSA-fvw5-9t6n-nwvr | CVE-2022-31042 | high | >=7,<7.4.4|>=4,<6.5.7 | Failure to strip the Cookie header on change in host or HTTP downgrade |
| guzzlehttp/guzzle | PKSA-6d8m-6kgw-18zr | CVE-2022-29248 | high | >=7,<7.4.3|>=4,<6.5.6 | Cross-domain cookie leakage |
| phpseclib/phpseclib | PKSA-h7cz-q7zq-mdkt | - | ? | >=4.0.0,<4.0.3|>=3.0.0,<3.0.58|>=2.0.0,<2.0.56|>=1.0.0,<1.0.31 | phpseclib unbounded PBKDF iteration count in encrypted key/PFX/CMS parsing enables CPU-exhaustion DoS |
| phpseclib/phpseclib | PKSA-12sz-bcny-pk4m | CVE-2026-84308 | medium | >=4.0.0,<4.0.1|<3.0.57 | phpseclib — non-constant-time X25519 scalar multiplication permits full private-key recovery |
| phpseclib/phpseclib | PKSA-432p-hv1d-chf7 | CVE-2026-55599 | medium | >=3.0.0,<=3.0.53|>=2.0.0,<=2.0.54|>=0.1.1,<=1.0.29 | phpseclib: X.509 certificate validation sends attacker-controlled outbound requests (server-side request forgery) via Authority Information Access |
| phpseclib/phpseclib | PKSA-smrh-yx37-92ws | CVE-2026-44167 | high | >=0.1.1,<=1.0.28|>=3.0.0,<=3.0.51|>=2.0.0,<=2.0.53 | phpseclib has a CVE-2024-27355 mitigation bypass — OID amplification DoS in ASN1::decodeOID() |
| phpseclib/phpseclib | PKSA-zh4j-by9m-7mz8 | CVE-2026-40194 | low | >=0.1.1,<1.0.28|>=3.0.0,<3.0.51|>=2.0.0,<2.0.53 | phpseclib has a variable-time HMAC comparison in SSH2::get_binary_packet() using != instead of hash_equals() |
| phpseclib/phpseclib | PKSA-km2b-zc3b-mjm3 | CVE-2026-32935 | high | >=0.1.1,<=1.0.26|>=2.0.0,<=2.0.51|>=3.0.0,<=3.0.49 | phpseclib's AES-CBC unpadding susceptible to padding oracle timing attack |
| symfony/yaml | PKSA-nktx-f1n1-b4yd | CVE-2026-123792 | ? | >=2.0.0,<3.0.0|>=3.0.0,<4.0.0|>=4.0.0,<5.0.0|>=5.0.0,<5.1.0|>=5.1.0,<5.2.0|>=5.2.0,<5.3.0|>=5.3.0,<5.4.0|>=5.4.0,<5.4.56|>=6.0.0,<6.1.0|>=6.1.0,<6.2.0|>=6.2.0,<6.3.0|>=6.3.0,<6.4.0|>=6.4.0,<6.4.50|>=7.0.0,<7.1.0|>=7.1.0,<7.2.0|>=7.2.0,<7.3.0|>=7.3.0,<7.4.0|>=7.4.0,<7.4.23|>=8.0.0,<8.1.0|>=8.1.0,<8.1.11 | Exponential and Quadratic Parse Times in the YAML Parser Let a Single Document Hold a Process |
| symfony/yaml | PKSA-xz3r-9gp4-4m1z | CVE-2026-109413 | high | >=2.0.0,<3.0.0|>=3.0.0,<4.0.0|>=4.0.0,<5.0.0|>=5.0.0,<5.1.0|>=5.1.0,<5.2.0|>=5.2.0,<5.3.0|>=5.3.0,<5.4.0|>=5.4.0,<5.4.54|>=6.0.0,<6.1.0|>=6.1.0,<6.2.0|>=6.2.0,<6.3.0|>=6.3.0,<6.4.0|>=6.4.0,<6.4.45|>=7.0.0,<7.1.0|>=7.1.0,<7.2.0|>=7.2.0,<7.3.0|>=7.3.0,<7.4.0|>=7.4.0,<7.4.18|>=8.0.0,<8.1.0|>=8.1.0,<8.1.6 | CVE-2026-109413: Unbounded Recursion in the YAML Inline Lexer Lets a Single Document Crash the Process |
| symfony/yaml | PKSA-v5yj-8nmz-sk2q | CVE-2026-45304 | low | >=2.0.0,<3.0.0|>=3.0.0,<4.0.0|>=4.0.0,<5.0.0|>=5.0.0,<5.1.0|>=5.1.0,<5.2.0|>=5.2.0,<5.3.0|>=5.3.0,<5.4.0|>=5.4.0,<5.4.52|>=6.0.0,<6.1.0|>=6.1.0,<6.2.0|>=6.2.0,<6.3.0|>=6.3.0,<6.4.0|>=6.4.0,<6.4.40|>=7.0.0,<7.1.0|>=7.1.0,<7.2.0|>=7.2.0,<7.3.0|>=7.3.0,<7.4.0|>=7.4.0,<7.4.12|>=8.0.0,<8.0.12 | CVE-2026-45304: YAML Parser Exponential Memory Allocation via Recursive Collection-Alias Expansion ("Billion Laughs") |
| symfony/yaml | PKSA-ft77-7h5f-p3r6 | CVE-2026-45305 | low | >=2.0.0,<3.0.0|>=3.0.0,<4.0.0|>=4.0.0,<5.0.0|>=5.0.0,<5.1.0|>=5.1.0,<5.2.0|>=5.2.0,<5.3.0|>=5.3.0,<5.4.0|>=5.4.0,<5.4.52|>=6.0.0,<6.1.0|>=6.1.0,<6.2.0|>=6.2.0,<6.3.0|>=6.3.0,<6.4.0|>=6.4.0,<6.4.40|>=7.0.0,<7.1.0|>=7.1.0,<7.2.0|>=7.2.0,<7.3.0|>=7.3.0,<7.4.0|>=7.4.0,<7.4.12|>=8.0.0,<8.0.12 | CVE-2026-45305: YAML Parser ReDoS via Catastrophic Backtracking in Parser::cleanup() Regex |
| symfony/yaml | PKSA-b14r-zh1d-vdrc | CVE-2026-45133 | low | >=2.0.0,<3.0.0|>=3.0.0,<4.0.0|>=4.0.0,<5.0.0|>=5.0.0,<5.1.0|>=5.1.0,<5.2.0|>=5.2.0,<5.3.0|>=5.3.0,<5.4.0|>=5.4.0,<5.4.52|>=6.0.0,<6.1.0|>=6.1.0,<6.2.0|>=6.2.0,<6.3.0|>=6.3.0,<6.4.0|>=6.4.0,<6.4.40|>=7.0.0,<7.1.0|>=7.1.0,<7.2.0|>=7.2.0,<7.3.0|>=7.3.0,<7.4.0|>=7.4.0,<7.4.12|>=8.0.0,<8.0.12 | CVE-2026-45133: YAML Parser Stack Exhaustion via Unbounded Recursion in Nested Blocks, Sequences, and Mappings |
| phpunit/phpunit | PKSA-z3gr-8qht-p93v | CVE-2026-24765 | high | >=0,<8.5.52|>=9.0.0,<9.6.33|>=10.0.0,<10.5.62|>=11.0.0,<11.5.50|>=12.0.0,<12.5.8 | Unsafe Deserialization in PHPT Code Coverage Handling |
| yiisoft/yii2 | PKSA-mxtc-f5ct-dqqd | CVE-2026-39850 | high | <2.0.55 | Yii 2: Local file inclusion via view parameter name collision |
| guzzlehttp/psr7 | PKSA-vznr-tgp9-fd7d | CVE-2026-59882 | medium | <2.12.3 | guzzlehttp/psr7: Host Confusion via Weak URI Host Validation |
| guzzlehttp/psr7 | PKSA-7qs6-zvnz-h66r | CVE-2026-55766 | medium | <2.12.1 | CRLF injection in HTTP start-line serialization |
| guzzlehttp/psr7 | PKSA-gm5x-j3mz-71n9 | CVE-2026-49214 | medium | <2.10.2 | CRLF injection via URI host component |
| guzzlehttp/psr7 | PKSA-jj5t-2zs1-dcfm | CVE-2026-48998 | medium | <2.10.2 | Host confusion via authority reinterpretation |
| psy/psysh | PKSA-4s4z-t146-6123 | CVE-2026-25129 | medium | <=0.11.22|>=0.12.0,<=0.12.18 | PsySH has Local Privilege Escalation via CWD .psysh.php auto-load |
| yiisoft/yii2-gii | PKSA-bbgw-mkqz-n76v | CVE-2022-34297 | medium | <=2.2.4 | Yii2 Gii Cross-site Scripting vulnerability |
| yiisoft/yii2-redis | PKSA-tv9g-g554-cxh4 | CVE-2025-48493 | medium | <2.0.20 | Yii 2 Redis may expose AUTH parameters in logs in case of connection failure |
| league/flysystem | PKSA-w9tt-7782-78jx | CVE-2026-102601 | low | <=3.35.2 | Flysystem: WhitespacePathNormalizer's control-character (CorruptedPathDetected) check is bypassed by malformed UTF-8 in the path, affecting every adapter |
| symfony/dom-crawler | PKSA-5r1g-c7b7-y1zg | CVE-2026-45071 | low | >=2.0.0,<3.0.0|>=3.0.0,<4.0.0|>=4.0.0,<5.0.0|>=5.0.0,<5.1.0|>=5.1.0,<5.2.0|>=5.2.0,<5.3.0|>=5.3.0,<5.4.0|>=5.4.0,<5.4.52|>=6.0.0,<6.1.0|>=6.1.0,<6.2.0|>=6.2.0,<6.3.0|>=6.3.0,<6.4.0|>=6.4.0,<6.4.40|>=7.0.0,<7.1.0|>=7.1.0,<7.2.0|>=7.2.0,<7.3.0|>=7.3.0,<7.4.0|>=7.4.0,<7.4.12|>=8.0.0,<8.0.12 | CVE-2026-45071: XXE (Local File Disclosure) in DomCrawler::addXmlContent() via validateOnParse = true |
| symfony/polyfill-intl-idn | PKSA-dwsq-ppd2-mb1x | CVE-2026-46644 | low | >=1.17.1,<1.38.1 | CVE-2026-46644: symfony/polyfill-intl-idn accepts xn-- labels whose Punycode payload decodes to ASCII-only: insecure equivalence |

## 统计

- 受影响包：14（runtime 9 / dev 5）
- 通告总数：70（全部依赖）
- `--no-dev` 生产视图：9 个包 / 61 条
