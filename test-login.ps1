$body = '{"email":"admin@sistema.com","password":"admin123"}'
try {
    $response = Invoke-RestMethod -Method Post -Uri 'http://localhost:8080/auth/login' -Headers @{'Content-Type'='application/json'} -Body $body
    Write-Host "Login exitoso:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
