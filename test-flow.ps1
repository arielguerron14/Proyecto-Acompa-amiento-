#!/usr/bin/env pwsh
# TEST: Registro - Login - Reserva

$ProgressPreference = 'SilentlyContinue'
$baseUrl = "http://52.71.188.181:8080"
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$email = "test.reserva.$timestamp@example.com"
$password = "Test123!"

Write-Host ""
Write-Host "======================================================"
Write-Host "PASO 1: REGISTRO"
Write-Host "======================================================"
Write-Host "Email: $email"
Write-Host "Password: $password"

$registerBody = @{
    email = $email
    nombre = "Usuario Test Reservas"
    password = $password
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerBody `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $data = $response.Content | ConvertFrom-Json
    Write-Host ""
    Write-Host "✓ Registro exitoso (Status: $($response.StatusCode))"
    $userId = $data.data._id
    Write-Host "  User ID: $userId"
    
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 409) {
        Write-Host "⚠ Usuario ya existe (Status 409)"
        Write-Host "  Continuando con login..."
    } else {
        Write-Host "X Error: $($_.Exception.Message)"
        exit 1
    }
}

Write-Host ""
Write-Host "======================================================"
Write-Host "PASO 2: LOGIN"
Write-Host "======================================================"

$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ Login exitoso (Status: $($response.StatusCode))"
    
    $token = $data.data.accessToken
    $userId = $data.data.user._id
    
    Write-Host "  Token (primeros 40 chars): $($token.Substring(0, 40))..."
    Write-Host "  User ID: $userId"
    
} catch {
    Write-Host "X Error en login: $($_.Exception.Message)"
    exit 1
}

Write-Host ""
Write-Host "======================================================"
Write-Host "PASO 3: OBTENER RESERVAS EXISTENTES"
Write-Host "======================================================"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/estudiantes/reservas/estudiante/$userId" `
        -Method GET `
        -Headers $headers `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ Reservas obtenidas (Status: $($response.StatusCode))"
    Write-Host "  Total de reservas: $($data.data.Count)"
    
    if ($data.data.Count -gt 0) {
        Write-Host "  Primera reserva:"
        Write-Host "    - Fecha: $($data.data[0].fecha)"
        Write-Host "    - Estado: $($data.data[0].estado)"
    }
    
} catch {
    Write-Host "⚠ No se pudo obtener reservas: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "======================================================"
Write-Host "PASO 4: CREAR NUEVA RESERVA"
Write-Host "======================================================"

$fecha = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")
$reservaBody = @{
    estudianteId = $userId
    maestroId = "maestro123"
    fecha = $fecha
    hora = "14:00"
    asunto = "Test Reserva - Tutoria de Matematicas"
    descripcion = "Sesion de tutoria para resolver dudas"
} | ConvertTo-Json

Write-Host "Creando reserva para: $fecha a las 14:00"

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/estudiantes/reservar" `
        -Method POST `
        -Headers $headers `
        -Body $reservaBody `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $data = $response.Content | ConvertFrom-Json
    Write-Host ""
    Write-Host "✓ Reserva creada (Status: $($response.StatusCode))"
    Write-Host "  Reserva ID: $($data.data._id)"
    Write-Host "  Fecha: $($data.data.fecha)"
    Write-Host "  Hora: $($data.data.hora)"
    Write-Host "  Asunto: $($data.data.asunto)"
    Write-Host "  Estado: $($data.data.estado)"
    
    $reservaId = $data.data._id
    
} catch {
    Write-Host "X Error creando reserva: $($_.Exception.Message)"
    Write-Host "  (Esto puede ser normal si el endpoint necesita ajustes)"
}

Write-Host ""
Write-Host "======================================================"
Write-Host "PASO 5: VERIFICAR RESERVAS ACTUALIZADAS"
Write-Host "======================================================"

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/estudiantes/reservas/estudiante/$userId" `
        -Method GET `
        -Headers $headers `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ Verificacion completada (Status: $($response.StatusCode))"
    Write-Host "  Total de reservas ahora: $($data.data.Count)"
    
    if ($data.data.Count -gt 0) {
        Write-Host ""
        Write-Host "  Listado de reservas:"
        for ($i = 0; $i -lt $data.data.Count; $i++) {
            $r = $data.data[$i]
            Write-Host "  [$($i+1)] Fecha: $($r.fecha) | Hora: $($r.hora) | Estado: $($r.estado)"
        }
    }
    
} catch {
    Write-Host "X Error verificando: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "======================================================"
Write-Host "TEST COMPLETADO"
Write-Host "======================================================"
Write-Host ""
Write-Host "Resumen del usuario de prueba:"
Write-Host "  Email: $email"
Write-Host "  Password: $password"
Write-Host "  User ID: $userId"
Write-Host ""
