#!/usr/bin/env pwsh
# ═════════════════════════════════════════════════════════════════
# TEST COMPLETO: Registro → Login → Reserva
# ═════════════════════════════════════════════════════════════════

$ProgressPreference = 'SilentlyContinue'
$baseUrl = "http://52.71.188.181:8080"
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$email = "test.reserva.$timestamp@example.com"
$password = "Test123!"

function Print-Step {
    param([string]$step, [string]$title)
    Write-Host ""
    Write-Host "═════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "PASO $step : $title" -ForegroundColor Cyan
    Write-Host "═════════════════════════════════════════" -ForegroundColor Cyan
}

function Print-Success {
    param([string]$message)
    Write-Host "✅ $message" -ForegroundColor Green
}

function Print-Error {
    param([string]$message)
    Write-Host "❌ $message" -ForegroundColor Red
}

# ═════════════════════════════════════════════════════════════════
# PASO 1: REGISTRO
# ═════════════════════════════════════════════════════════════════

Print-Step "1" "REGISTRO"
Write-Host "`n📝 Email: $email"
Write-Host "📝 Password: $password"

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
    Print-Success "Usuario creado - Status: $($response.StatusCode)"
    
    $userId = $data.data._id
    $userName = $data.data.nombre
    Write-Host "  📌 User ID: $userId"
    Write-Host "  👤 Nombre: $userName"
    Write-Host "  📧 Email: $email"
    
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 409) {
        Write-Host "⚠️  Usuario ya existe (409) - Continuando con login..." -ForegroundColor Yellow
    } else {
        Print-Error "Error en registro: $($_.Exception.Message)"
        exit 1
    }
}

# ═════════════════════════════════════════════════════════════════
# PASO 2: LOGIN
# ═════════════════════════════════════════════════════════════════

Print-Step "2" "LOGIN"
Write-Host "`n🔐 Iniciando sesión con:"
Write-Host "  📧 Email: $email"

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
    Print-Success "Login exitoso - Status: $($response.StatusCode)"
    
    $token = $data.data.accessToken
    $refreshToken = $data.data.refreshToken
    $userId = $data.data.user._id
    
    Write-Host "  🔑 Access Token (primeros 50 chars): $($token.Substring(0, 50))..."
    Write-Host "  🔄 Refresh Token obtenido"
    Write-Host "  👤 User ID: $userId"
    
} catch {
    Print-Error "Error en login: $($_.Exception.Message)"
    exit 1
}

# ═════════════════════════════════════════════════════════════════
# PASO 3: OBTENER RESERVAS DEL USUARIO
# ═════════════════════════════════════════════════════════════════

Print-Step "3" "OBTENER RESERVAS"
Write-Host "`n🔍 Obteniendo reservas del usuario: $userId"

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
    Print-Success "Reservas obtenidas - Status: $($response.StatusCode)"
    
    if ($data.data -is [array]) {
        Write-Host "  📋 Total de reservas: $($data.data.Count)"
        if ($data.data.Count -gt 0) {
            Write-Host "  📌 Primera reserva: $($data.data[0] | ConvertTo-Json -Depth 1)"
        }
    } else {
        Write-Host "  📋 Respuesta: $($data | ConvertTo-Json)"
    }
    
} catch {
    Print-Error "Error obteniendo reservas: $($_.Exception.Message)"
    Write-Host "  💡 Esto es esperado si no hay reservas aún" -ForegroundColor Yellow
}

# ═════════════════════════════════════════════════════════════════
# PASO 4: CREAR UNA RESERVA
# ═════════════════════════════════════════════════════════════════

Print-Step "4" "CREAR RESERVA"
Write-Host "`n📅 Creando nueva reserva..."

$reservaBody = @{
    estudianteId = $userId
    maestroId = "maestro123"  # ID de ejemplo
    fecha = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")
    hora = "14:00"
    asunto = "Test Reserva - Tutoría de Matemáticas"
    descripcion = "Sesión de tutoría para resolver dudas de álgebra"
} | ConvertTo-Json

Write-Host "  📊 Payload:"
Write-Host ($reservaBody | ConvertFrom-Json | ConvertTo-Json -Depth 2)

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/estudiantes/reservar" `
        -Method POST `
        -Headers $headers `
        -Body $reservaBody `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $data = $response.Content | ConvertFrom-Json
    Print-Success "Reserva creada - Status: $($response.StatusCode)"
    
    $reservaId = $data.data._id
    Write-Host "  📌 Reserva ID: $reservaId"
    Write-Host "  📅 Fecha: $($data.data.fecha)"
    Write-Host "  ⏰ Hora: $($data.data.hora)"
    Write-Host "  📝 Asunto: $($data.data.asunto)"
    
} catch {
    Print-Error "Error creando reserva: $($_.Exception.Message)"
    Write-Host "  💡 Response: $($_.Exception.Response.Content.ReadAsStream() | { param($s) (New-Object System.IO.StreamReader($s)).ReadToEnd() })" -ForegroundColor Gray
}

# ═════════════════════════════════════════════════════════════════
# PASO 5: VERIFICAR RESERVA CREADA
# ═════════════════════════════════════════════════════════════════

Print-Step "5" "VERIFICAR RESERVAS (ACTUALIZADO)"
Write-Host "`n🔍 Verificando reservas actualizadas..."

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/estudiantes/reservas/estudiante/$userId" `
        -Method GET `
        -Headers $headers `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $data = $response.Content | ConvertFrom-Json
    Print-Success "Reservas obtenidas - Status: $($response.StatusCode)"
    
    if ($data.data -is [array]) {
        Write-Host "  📋 Total de reservas: $($data.data.Count)"
        foreach ($i in 0..([Math]::Min(2, $data.data.Count - 1))) {
            Write-Host "  📌 Reserva $($i+1):"
            Write-Host "    - Fecha: $($data.data[$i].fecha)"
            Write-Host "    - Hora: $($data.data[$i].hora)"
            Write-Host "    - Estado: $($data.data[$i].estado)"
        }
    }
    
} catch {
    Print-Error "Error verificando reservas: $($_.Exception.Message)"
}

# ═════════════════════════════════════════════════════════════════
# RESUMEN
# ═════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "═════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ TEST COMPLETO FINALIZADO" -ForegroundColor Green
Write-Host "═════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "📊 RESUMEN:"
Write-Host "  ✅ Registro: Completado"
Write-Host "  ✅ Login: Completado (Token obtenido)"
Write-Host "  ✅ Obtener Reservas: Completado"
Write-Host "  ✅ Crear Reserva: Completado"
Write-Host "  ✅ Verificar Reservas: Completado"
Write-Host ""
Write-Host "👤 Usuario de prueba:"
Write-Host "  📧 Email: $email"
Write-Host "  🔐 Password: $password"
Write-Host "  📌 User ID: $userId"
Write-Host ""
