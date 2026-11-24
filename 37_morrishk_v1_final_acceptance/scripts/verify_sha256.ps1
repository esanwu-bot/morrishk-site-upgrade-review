param([string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path)
# Verifies 37_morrishk_v1_final_acceptance/SHA256SUMS against the committed blobs,
# so the result is independent of core.autocrlf / checkout line endings.

$pkgRel = '37_morrishk_v1_final_acceptance'
$sums = Join-Path $RepoRoot "$pkgRel/SHA256SUMS"
$tmp = Join-Path $env:TEMP 'sha256_blob_check.bin'
$bad = 0
$n = 0
Push-Location $RepoRoot
try {
    foreach ($line in Get-Content $sums) {
        if ($line -notmatch '^([0-9a-f]{64})  (.+)$') { continue }
        $expected = $Matches[1]; $rel = $Matches[2]; $n++
        cmd /c "git cat-file blob `"HEAD:$pkgRel/$rel`" > `"$tmp`""
        $actual = (Get-FileHash $tmp -Algorithm SHA256).Hash.ToLower()
        if ($actual -ne $expected) { Write-Output "MISMATCH $rel"; $bad++ }
    }
} finally { Pop-Location; Remove-Item $tmp -ErrorAction SilentlyContinue }
Write-Output "checked=$n mismatches=$bad"
if ($bad -eq 0) { Write-Output 'SHA256SUMS OK' } else { exit 1 }
