$ErrorActionPreference = 'SilentlyContinue'

$files = Get-ChildItem -Path "requests" -Filter "*.json" | Sort-Object Name

foreach ($file in $files) {
    Write-Host "=================================================="
    Write-Host "Running test for $($file.Name)"
    Write-Host "=================================================="
    
    # Run the test, capture output
    npm run ai-test "requests/$($file.Name)"
    
    Write-Host ""
    Write-Host "Finished $($file.Name)"
    Write-Host ""
}

Write-Host "All tests completed."
