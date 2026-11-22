$ErrorActionPreference = 'Stop'
$src = 'E:\workspace\.scratch\morrishk-commercial-signoff\31_customer_commercial_pack'
$dst = 'E:\workspace\.scratch\morrishk-commercial\reviewer_evidence_r1\pdf'
New-Item -ItemType Directory -Force -Path $dst | Out-Null
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$word.ActivePrinter = 'Microsoft Print to PDF'
$files = @(
  '00_CUSTOMER_PACK_INDEX_AND_VERSION.docx',
  '02_FUNCTION_SCOPE_CONFIRMATION.docx',
  '04_COMMERCIAL_QUOTATION_AND_COST_BOUNDARIES.docx'
)
foreach ($f in $files) {
  $in = Join-Path $src $f
  $out = Join-Path $dst ($f -replace '\.docx$', '.pdf')
  $ok = $false
  for ($attempt = 1; $attempt -le 2 -and -not $ok; $attempt++) {
    if (Test-Path $out) { Remove-Item $out -Force }
    $doc = $word.Documents.Open($in, $false, $false)
    $doc.Repaginate()
    $pages = $doc.ComputeStatistics(2)
    $doc.PrintOut($false, $false, 0, $out)
    Start-Sleep -Seconds 8
    $doc.Close($false)
    Start-Sleep -Seconds 2
    $bytes = 0
    if (Test-Path $out) { $bytes = (Get-Item $out).Length }
    if ($bytes -gt 0) { $ok = $true }
    Write-Output ("$f attempt=$attempt pages=$pages bytes=$bytes")
  }
}
Start-Sleep -Seconds 3
$word.Quit()