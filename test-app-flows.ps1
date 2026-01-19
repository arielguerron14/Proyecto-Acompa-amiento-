#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Pruebas completas de flujo de la aplicación
    - Registrar usuario
    - Ingresar (login)
    - Crear reserva
    - Reservar
#>

param(
    [string]$ApiGateway = "http://98.86.94.92:8080"
)

$ErrorActionPreference = "Continue"

# Variables globales
$testResults = @()
$sessionToken = $null
$userId = $null
$reservationId = $null

function Write-TestHeader {
    param([string]$title)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  $title" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
}

function Write-TestStep {
    param([string]$step, [string]$color = "Yellow")
    Write-Host "`n$step" -ForegroundColor $color
}

function Test-Endpoint {
    param(
        [string]$name,
        [string]$method,
        [string]$endpoint,
        [object]$body,
        [hashtable]$headers = @{}
    )
    
    try {
        $url = "$ApiGateway$endpoint"
        Write-Host "  📝 Endpoint: $method $endpoint" -ForegroundColor Gray
        
        $params = @{
            Uri = $url
            Method = $method
            ContentType = "application/json"
            TimeoutSec = 30
        }
        
        if ($body) {
            $params['Body'] = ($body | ConvertTo-Json -Compress)
            Write-Host "  📤 Payload: $($params['Body'])" -ForegroundColor Gray
        }
        
        if ($headers.Count -gt 0) {
            $params['Headers'] = $headers
        }
        
        Write-Host "  ⏳ Esperando respuesta..." -ForegroundColor Gray
        $response = Invoke-WebRequest @params -ErrorAction Stop
        
        $result = @{
            name = $name
            status = "✅ EXITOSA"
            code = $response.StatusCode
            message = "OK"
            data = $null
        }
        
        if ($response.Content) {
            try {
                $result.data = $response.Content | ConvertFrom-Json
                Write-Host "  📥 Respuesta: $($response.Content.Substring(0, [Math]::Min(150, $response.Content.Length)))" -ForegroundColor Green
            } catch {
                $result.data = $response.Content
                Write-Host "  📥 Respuesta (texto): $($response.Content.Substring(0, [Math]::Min(150, $response.Content.Length)))" -ForegroundColor Green
            }
        }
        
        Write-Host "  ✅ Status Code: $($response.StatusCode)" -ForegroundColor Green
        return $result
    }
    catch {
        $errorMsg = $_.Exception.Message
        if ($_.Exception.Response) {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $errorMsg = $reader.ReadToEnd()
            $reader.Close()
        }
        
        $result = @{
            name = $name
            status = "❌ FALLÓ"
            code = $_.Exception.Response.StatusCode
            message = $errorMsg
            error = $_.Exception.Message
        }
        
        Write-Host "  ❌ Error: $($result.error)" -ForegroundColor Red
        return $result
    }
}

# ============================================================================
# INICIO DE PRUEBAS
# ============================================================================

Write-TestHeader "🧪 PRUEBAS DE FLUJO DE LA APLICACIÓN"
Write-Host "API Gateway: $ApiGateway" -ForegroundColor Yellow
Write-Host "Hora: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow

# ============================================================================
# PRUEBA 1: VERIFICAR CONECTIVIDAD
# ============================================================================

Write-TestStep "1️⃣  VERIFICAR CONECTIVIDAD CON API GATEWAY" "Magenta"

$healthTest = Test-Endpoint -name "Health Check" -method "GET" -endpoint "/health"
$testResults += $healthTest

if ($healthTest.status -eq "❌ FALLÓ") {
    Write-Host ""
    Write-Host "⚠️  No hay conectividad con el API Gateway" -ForegroundColor Red
    Write-Host "    El servidor no está respondiendo en: $ApiGateway" -ForegroundColor Red
    exit 1
}

# ============================================================================
# PRUEBA 2: REGISTRAR USUARIO (SIGNUP)
# ============================================================================

Write-TestStep "2️⃣  REGISTRAR USUARIO (SIGNUP)" "Magenta"

$email = "testuser_$(Get-Random)@example.com"
$signupBody = @{
    email = $email
    password = "TestPassword123!"
    firstName = "Test"
    lastName = "User"
    phoneNumber = "+1234567890"
}

Write-Host "  📧 Email: $email" -ForegroundColor Gray

$signupTest = Test-Endpoint -name "User Signup" -method "POST" -endpoint "/auth/signup" -body $signupBody
$testResults += $signupTest

if ($signupTest.status -eq "✅ EXITOSA") {
    $userId = $signupTest.data.userId
    Write-Host "  ✅ Usuario registrado. ID: $userId" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Error en registro: $($signupTest.message)" -ForegroundColor Yellow
}

# ============================================================================
# PRUEBA 3: LOGIN (OBTENER TOKEN)
# ============================================================================

Write-TestStep "3️⃣  INGRESAR / LOGIN" "Magenta"

$loginBody = @{
    email = $email
    password = "TestPassword123!"
}

$loginTest = Test-Endpoint -name "User Login" -method "POST" -endpoint "/auth/login" -body $loginBody
$testResults += $loginTest

if ($loginTest.status -eq "✅ EXITOSA") {
    $sessionToken = $loginTest.data.token
    Write-Host "  🔑 Token obtenido: $($sessionToken.Substring(0, 20))..." -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Error en login: $($loginTest.message)" -ForegroundColor Yellow
}

# ============================================================================
# PRUEBA 4: CREAR RESERVA
# ============================================================================

Write-TestStep "4️⃣  CREAR RESERVA" "Magenta"

$reservationBody = @{
    title = "Reunión de Prueba"
    description = "Esta es una reserva de prueba"
    startDate = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
    endDate = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
    startTime = "10:00"
    endTime = "11:00"
    location = "Sala 1"
    capacity = 5
    status = "PENDING"
}

Write-Host "  📅 Reserva: $($reservationBody.title)" -ForegroundColor Gray
Write-Host "  📍 Ubicación: $($reservationBody.location)" -ForegroundColor Gray

$headers = @{}
if ($sessionToken) {
    $headers['Authorization'] = "Bearer $sessionToken"
    Write-Host "  🔐 Usando token de autenticación" -ForegroundColor Gray
}

$createReservationTest = Test-Endpoint -name "Create Reservation" -method "POST" -endpoint "/reservations" -body $reservationBody -headers $headers
$testResults += $createReservationTest

if ($createReservationTest.status -eq "✅ EXITOSA") {
    $reservationId = $createReservationTest.data.id
    Write-Host "  ✅ Reserva creada. ID: $reservationId" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Error creando reserva: $($createReservationTest.message)" -ForegroundColor Yellow
}

# ============================================================================
# PRUEBA 5: RESERVAR (CONFIRMAR RESERVA)
# ============================================================================

Write-TestStep "5️⃣  RESERVAR / CONFIRMAR RESERVA" "Magenta"

if ($reservationId) {
    $bookingBody = @{
        status = "CONFIRMED"
        notes = "Reserva confirmada desde prueba"
    }
    
    Write-Host "  📝 Confirmando reserva: $reservationId" -ForegroundColor Gray
    
    $bookingTest = Test-Endpoint -name "Book Reservation" -method "PATCH" -endpoint "/reservations/$reservationId" -body $bookingBody -headers $headers
    $testResults += $bookingTest
    
    if ($bookingTest.status -eq "✅ EXITOSA") {
        Write-Host "  ✅ Reserva confirmada exitosamente" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Error confirmando: $($bookingTest.message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠️  No hay reserva ID para confirmar" -ForegroundColor Yellow
}

# ============================================================================
# PRUEBA 6: OBTENER RESERVAS (VERIFICACIÓN)
# ============================================================================

Write-TestStep "6️⃣  OBTENER RESERVAS (VERIFICACIÓN)" "Magenta"

$getReservationsTest = Test-Endpoint -name "Get Reservations" -method "GET" -endpoint "/reservations" -headers $headers
$testResults += $getReservationsTest

if ($getReservationsTest.status -eq "✅ EXITOSA") {
    $count = if ($getReservationsTest.data -is [array]) { $getReservationsTest.data.Count } else { 1 }
    Write-Host "  ✅ Total de reservas: $count" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Error obteniendo reservas: $($getReservationsTest.message)" -ForegroundColor Yellow
}

# ============================================================================
# RESUMEN DE RESULTADOS
# ============================================================================

Write-Host ""
Write-TestHeader "📊 RESUMEN DE PRUEBAS"

$exitosas = @($testResults | Where-Object { $_.status -eq "✅ EXITOSA" }).Count
$fallidas = @($testResults | Where-Object { $_.status -eq "❌ FALLÓ" }).Count
$total = $testResults.Count

Write-Host ""
Write-Host "  Pruebas Exitosas: $exitosas/$total" -ForegroundColor Green
Write-Host "  Pruebas Fallidas:  $fallidas/$total" -ForegroundColor $(if ($fallidas -gt 0) { "Red" } else { "Green" })
Write-Host ""

foreach ($result in $testResults) {
    $icon = if ($result.status -eq "✅ EXITOSA") { "✅" } else { "❌" }
    $color = if ($result.status -eq "✅ EXITOSA") { "Green" } else { "Red" }
    Write-Host "  $icon $($result.name): $($result.status) (Code: $($result.code))" -ForegroundColor $color
}

# ============================================================================
# CONCLUSIÓN
# ============================================================================

Write-Host ""
Write-TestHeader "🎯 CONCLUSIÓN"

if ($exitosas -eq $total) {
    Write-Host "  ✅ ¡TODOS LOS FLUJOS FUNCIONAN CORRECTAMENTE!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Resumen de pruebas realizadas:" -ForegroundColor Green
    Write-Host "    ✅ Conectividad con API Gateway" -ForegroundColor Green
    Write-Host "    ✅ Registro de usuario (Sign Up)" -ForegroundColor Green
    Write-Host "    ✅ Login / Autenticación" -ForegroundColor Green
    Write-Host "    ✅ Crear reserva" -ForegroundColor Green
    Write-Host "    ✅ Confirmar/Reservar" -ForegroundColor Green
    Write-Host "    ✅ Obtener reservas" -ForegroundColor Green
    Write-Host ""
    Write-Host "  La aplicación está funcionando correctamente y lista para usar." -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Algunas pruebas fallaron" -ForegroundColor Yellow
    Write-Host "  Por favor revisar los errores arriba" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
