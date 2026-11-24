<#
Round 37 - Attachment download authorization matrix.
Runs against the Nginx + php-cgi test instance and records raw HTTP results.

Usage:
  powershell -ExecutionPolicy Bypass -File run_download_auth_matrix.ps1 `
      -BaseUrl http://127.0.0.1:8096 -CredsFile "$env:TEMP\r37_creds.txt"
#>
param(
    [string]$BaseUrl = 'http://127.0.0.1:8096',
    [string]$CredsFile = "$env:TEMP\r37_creds.txt",
    [string]$MySql = 'D:\phpstudy_pro\Extensions\MySQL8.0.12\bin\mysql.exe',
    [string]$DbUser = 'root',
    [string]$DbPass = 'root',
    [string]$DbName = 'morrishk_demo',
    [string]$UploadsDir = 'C:\r37app\runtime\uploads'
)

$ErrorActionPreference = 'Continue'
$probeName = 'r37authprobe0123456789.txt'
$probeRel  = "uploads/$probeName"
$probePath = Join-Path $UploadsDir $probeName
$tmpJars = @()

function Write-Step($text) { Write-Output ""; Write-Output "### $text" }

$script:loginLog = @()

function New-Login([string]$user, [string]$pass) {
    $jar = Join-Path $env:TEMP ("r37_jar_" + $user + ".txt")
    if (Test-Path $jar) { Remove-Item $jar -Force }
    $html = curl.exe -s -c $jar "$BaseUrl/site/login.html"
    $joined = ($html -join "`n")
    if ($joined -match 'name="_csrf"[^>]*value="([^"]+)"') { $token = $Matches[1] } else { throw "csrf token not found for $user" }
    $res = curl.exe -s -o NUL -w '%{http_code}|%{redirect_url}' -b $jar -c $jar -X POST `
        -d "username=$user" --data-urlencode "password=$pass" --data-urlencode "_csrf=$token" `
        "$BaseUrl/site/login.html"
    $script:loginLog += "login[$user] => $res"
    return $jar
}

function Get-Status([string]$url, [string]$jar) {
    if ($jar) { return (curl.exe -s -o NUL -w '%{http_code}' -b $jar $url) }
    return (curl.exe -s -o NUL -w '%{http_code}' $url)
}

function Get-Headers([string]$url, [string]$jar) {
    if ($jar) { return (curl.exe -s -D - -o NUL -b $jar $url) }
    return (curl.exe -s -D - -o NUL $url)
}

function Invoke-Sql([string]$sql) {
    return (& $MySql "-u$DbUser" "-p$DbPass" "-D" $DbName -N -e $sql 2>$null)
}

# --- credentials -----------------------------------------------------------
$creds = @{}
foreach ($line in Get-Content $CredsFile) {
    if ($line -match '^(\S+)\s+(\S+)\s+role=(\d)') {
        $creds[$Matches[1]] = @{ password = $Matches[2]; role = [int]$Matches[3] }
    }
}
foreach ($u in @('qa_tester','qa_other','qa_admin')) {
    if (-not $creds.ContainsKey($u)) { throw "missing credential for $u in $CredsFile" }
}

# --- fixture ---------------------------------------------------------------
Write-Step 'fixture setup'
Set-Content -Path $probePath -Value 'round37 synthetic attachment' -Encoding ASCII
$rowId = (Invoke-Sql "INSERT INTO snsii_cart (AddDate, Contact, Phone, Email, Files, IP, Url, Status, OwnerUserId, AddTime) VALUES (CURDATE(), 'ROUND37-SYNTHETIC', '000', 'synthetic@example.invalid', '$probeRel', '127.0.0.1', 'https://example.invalid', 0, 198, UNIX_TIMESTAMP()); SELECT LAST_INSERT_ID();")
$rowId = ($rowId | Select-Object -Last 1).Trim()
Write-Output "fixture inquiry id=$rowId files=$probeRel owner=198 (qa_other)"
Invoke-Sql "SELECT id, OwnerUserId, Files, Status FROM snsii_cart WHERE id=$rowId;" | ForEach-Object { Write-Output "db: $_" }

$jarOwner = New-Login 'qa_other'  $creds['qa_other'].password
$jarOther = New-Login 'qa_tester' $creds['qa_tester'].password
$jarAdmin = New-Login 'qa_admin'  $creds['qa_admin'].password
$script:loginLog | ForEach-Object { Write-Output $_ }

$url = "$BaseUrl/download/$probeName"

# --- T1 uploader / owner ---------------------------------------------------
Write-Step 'T1 uploader (qa_other, role=0, OwnerUserId=198) downloads own attachment'
Write-Output ("status=" + (Get-Status $url $jarOwner))
Get-Headers $url $jarOwner | Where-Object { $_ -match '^(HTTP/|Content-Type:|Content-Disposition:|X-Content-Type-Options:|Content-Length:)' }

# --- T2 other staff --------------------------------------------------------
Write-Step 'T2 other staff (qa_tester, role=0) downloads attachment of qa_other'
Write-Output ("status=" + (Get-Status $url $jarOther))
Write-Output ("status_again=" + (Get-Status $url $jarOther))

# --- T3 guest --------------------------------------------------------------
Write-Step 'T3 guest (no session) downloads attachment'
Write-Output ("status=" + (Get-Status $url $null))

# --- T4 authorized admin ---------------------------------------------------
Write-Step 'T4 admin (qa_admin, role=1) downloads attachment owned by qa_other'
Write-Output ("status=" + (Get-Status $url $jarAdmin))

# --- T5 unknown attachment -------------------------------------------------
Write-Step 'T5 unknown attachment name'
Write-Output ("status=" + (Get-Status "$BaseUrl/download/r37_no_such_file.txt" $jarOwner))

# --- T6 path traversal -----------------------------------------------------
Write-Step 'T6 path traversal attempts'
foreach ($p in @('/download/..%2Fconfig%2Fdb.php','/download/%2e%2e%2fdb%2f2026-11-24_cart_owner.sql','/download/..%5C..%5Cweb%2Findex.php')) {
    Write-Output ("$p => " + (Get-Status "$BaseUrl$p" $jarOwner))
}

# --- T7 tampered ids -------------------------------------------------------
Write-Step 'T7 tampered query ids / alternate file id by other staff'
Write-Output ("owner?Id=$rowId => " + (Get-Status "${url}?Id=$rowId" $jarOwner))
Write-Output ("other?Id=$rowId => " + (Get-Status "${url}?Id=$rowId" $jarOther))
Write-Output ("other?Oid=$rowId => " + (Get-Status "${url}?Oid=$rowId" $jarOther))
Write-Output ("other file swap => " + (Get-Status "$BaseUrl/download/37SOI8wNcK3ap19_T8Ili4Gr.txt" $jarOther))

# --- T8 registry / real file mismatch -------------------------------------
Write-Step 'T8 database row exists but physical file missing (renamed)'
$bak = "$probePath.bak"
Move-Item $probePath $bak -Force
Write-Output ("status=" + (Get-Status $url $jarOwner))
Move-Item $bak $probePath -Force
Write-Output ("status_after_restore=" + (Get-Status $url $jarOwner))

# --- T9 record deleted / revoked -------------------------------------------
Write-Step 'T9 inquiry record deleted (attachment orphaned)'
Invoke-Sql "DELETE FROM snsii_cart WHERE id=$rowId;" | Out-Null
Write-Output ("status=" + (Get-Status $url $jarOwner))
Write-Output ("status_admin=" + (Get-Status $url $jarAdmin))
Write-Output ("status_guest=" + (Get-Status $url $null))

# --- audit trail -----------------------------------------------------------
Write-Step 'audit log (runtime/audit/download-YYYYMMDD.log, current run tail)'
$auditFile = Join-Path (Split-Path $UploadsDir -Parent) ('audit/download-' + (Get-Date -Format 'yyyyMMdd') + '.log')
if (Test-Path $auditFile) { Get-Content $auditFile -Tail 16 | ForEach-Object { Write-Output $_ } } else { Write-Output "audit file not found: $auditFile" }

# --- cleanup ---------------------------------------------------------------
Write-Step 'cleanup'
if (Test-Path $probePath) { Remove-Item $probePath -Force }
foreach ($j in @($jarOwner,$jarOther,$jarAdmin)) { if ($j -and (Test-Path $j)) { Remove-Item $j -Force } }
Write-Output "fixture row removed, probe file removed"
Write-Output "DONE"

