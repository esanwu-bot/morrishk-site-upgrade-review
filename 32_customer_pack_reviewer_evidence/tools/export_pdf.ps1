$ErrorActionPreference = 'Stop'
$src = 'E:\workspace\.scratch\morrishk-commercial-signoff\31_customer_commercial_pack'
$dst = 'E:\workspace\.scratch\morrishk-commercial\reviewer_evidence\pdf'
New-Item -ItemType Directory -Force -Path $dst | Out-Null
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$word.ActivePrinter = 'Microsoft Print to PDF'
$files = @(
  '00_CUSTOMER_PACK_INDEX_AND_VERSION.docx',
  '01_MORRISHK_PROJECT_PLAN_AND_ROADMAP.docx',
  '02_FUNCTION_SCOPE_CONFIRMATION.docx',
  '03_SEO_IMPLEMENTATION_AND_MONTHLY_OPERATION.docx',
  '04_COMMERCIAL_QUOTATION_AND_COST_BOUNDARIES.docx',
  '05_PROJECT_KICKOFF_AND_ACCEPTANCE_PLAN.docx'
)
foreach ($f in $files) {
  $in = Join-Path $src $f
  $out = Join-Path $dst ($f -replace '\.docx$', '.pdf')
  if (Test-Path $out) { Remove-Item $out -Force }
  $doc = $word.Documents.Open($in, $false, $false)
  $pages = $doc.ComputeStatistics(2)
  $doc.PrintOut($false, $false, 0, $out)
  $doc.Close($false)
  Write-Output ("$f pages=$pages")
}
$word.Quit()