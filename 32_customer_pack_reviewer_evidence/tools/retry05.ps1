$src='E:\workspace\.scratch\morrishk-commercial-signoff\31_customer_commercial_pack\05_PROJECT_KICKOFF_AND_ACCEPTANCE_PLAN.docx'
$out='E:\workspace\.scratch\morrishk-commercial\reviewer_evidence\pdf\05_PROJECT_KICKOFF_AND_ACCEPTANCE_PLAN.pdf'
if (Test-Path $out) { Remove-Item $out -Force }
$word=New-Object -ComObject Word.Application
$word.Visible=$false; $word.DisplayAlerts=0
$word.ActivePrinter='Microsoft Print to PDF'
$doc=$word.Documents.Open($src,$false,$false)
Write-Output ('pages=' + $doc.ComputeStatistics(2))
$doc.PrintOut($false,$false,0,$out)
Start-Sleep -Seconds 8
$doc.Close($false)
$word.Quit()
Start-Sleep -Seconds 3
Write-Output ('size=' + (Get-Item $out).Length)
