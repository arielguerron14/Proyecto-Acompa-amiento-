$base = 'http://localhost:3010'
$auth = 'http://localhost:5015'
$ts = Get-Date -Format 'yyyyMMddHHmmssfff'
$email = "local.test.$ts@example.com"

Write-Host "Registering $email"
$reg = Invoke-RestMethod -Uri "$auth/auth/register" -Method POST -ContentType 'application/json' -Body (@{ email = $email; name = 'LocalTest'; password = 'Test123!' } | ConvertTo-Json)
Write-Host "Registered userId: $($reg.user.userId)"

$login = Invoke-RestMethod -Uri "$auth/auth/login" -Method POST -ContentType 'application/json' -Body (@{ email = $email; password = 'Test123!' } | ConvertTo-Json)
$token = $login.token
Write-Host "Token length: $($token.Length)"

Write-Host "GET reservas for user"
try {
    $get = Invoke-WebRequest -Uri "$base/reservas/estudiante/$($reg.user.userId)" -Method GET -Headers @{ Authorization = "Bearer $token" } -UseBasicParsing
    Write-Host "Status: $($get.StatusCode)"
    Write-Host "Body: $($get.Content)"
} catch {
    Write-Host "GET failed: $($_.Exception.Message)"
    if ($_.Exception.Response) { $body = $_.Exception.Response.Content; Write-Host "Error body: $body" }
}

Write-Host "POST reservar"
$payload = @{ estudianteId = $reg.user.userId; maestroId = 'maestro001'; fecha = '2026-01-13'; hora = '14:00' } | ConvertTo-Json
try {
    $create = Invoke-WebRequest -Uri "$base/reservar" -Method POST -ContentType 'application/json' -Headers @{ Authorization = "Bearer $token" } -Body $payload -UseBasicParsing
    Write-Host "Status: $($create.StatusCode)"
    Write-Host "Body: $($create.Content)"
} catch {
    Write-Host "POST failed: $($_.Exception.Message)"
    if ($_.Exception.Response) { $body = $_.Exception.Response.Content; Write-Host "Error body: $body" }
}
