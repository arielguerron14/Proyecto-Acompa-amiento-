# Verificar estado de Kafka, Zookeeper, RabbitMQ, Prometheus y Grafana

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verificando servicios de infraestructura" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configurar timeouts y valores por defecto
$timeout = 5

# 1. ZOOKEEPER
Write-Host "[1/5] Verificando ZOOKEEPER (puerto 2181)..." -ForegroundColor Yellow
try {
    $zkTest = @"
ruok
quit
"@
    # Intenta conexión TCP a Zookeeper
    $socket = New-Object System.Net.Sockets.TcpClient
    $async = $socket.BeginConnect("localhost", 2181, $null, $null)
    $wait = $async.AsyncWaitHandle.WaitOne($timeout * 1000)
    
    if ($wait -and $socket.Connected) {
        Write-Host "✅ ZOOKEEPER: FUNCIONANDO (puerto 2181 accesible)" -ForegroundColor Green
        $socket.Close()
    } else {
        Write-Host "❌ ZOOKEEPER: NO RESPONDE" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ ZOOKEEPER: ERROR - $_" -ForegroundColor Red
}
Write-Host ""

# 2. KAFKA
Write-Host "[2/5] Verificando KAFKA (puerto 9092)..." -ForegroundColor Yellow
try {
    $socket = New-Object System.Net.Sockets.TcpClient
    $async = $socket.BeginConnect("localhost", 9092, $null, $null)
    $wait = $async.AsyncWaitHandle.WaitOne($timeout * 1000)
    
    if ($wait -and $socket.Connected) {
        Write-Host "✅ KAFKA: FUNCIONANDO (puerto 9092 accesible)" -ForegroundColor Green
        Write-Host "   - Broker ID: 1, Listeners: PLAINTEXT://172.31.73.6:9092" -ForegroundColor Gray
        $socket.Close()
    } else {
        Write-Host "❌ KAFKA: NO RESPONDE" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ KAFKA: ERROR - $_" -ForegroundColor Red
}
Write-Host ""

# 3. RABBITMQ
Write-Host "[3/5] Verificando RABBITMQ (puerto 5672 y API 15672)..." -ForegroundColor Yellow
try {
    # Test AMQP port
    $socket = New-Object System.Net.Sockets.TcpClient
    $async = $socket.BeginConnect("localhost", 5672, $null, $null)
    $wait = $async.AsyncWaitHandle.WaitOne($timeout * 1000)
    
    if ($wait -and $socket.Connected) {
        Write-Host "✅ RABBITMQ: FUNCIONANDO (puerto 5672 AMQP accesible)" -ForegroundColor Green
        $socket.Close()
        
        # Test Management API
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:15672/api/overview" `
                -Credential (New-Object System.Management.Automation.PSCredential("guest", (ConvertTo-SecureString "guest" -AsPlainText -Force))) `
                -TimeoutSec 3 -ErrorAction SilentlyContinue
            
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ RABBITMQ Management API: FUNCIONANDO (puerto 15672)" -ForegroundColor Green
                Write-Host "   - Access: http://localhost:15672 (guest/guest)" -ForegroundColor Gray
            }
        } catch {
            Write-Host "⚠️  RABBITMQ Management API: NO ACCESIBLE (pero AMQP sí funciona)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ RABBITMQ: NO RESPONDE" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ RABBITMQ: ERROR - $_" -ForegroundColor Red
}
Write-Host ""

# 4. PROMETHEUS
Write-Host "[4/5] Verificando PROMETHEUS (puerto 9090)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9090/-/healthy" -TimeoutSec 3 -ErrorAction SilentlyContinue
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PROMETHEUS: FUNCIONANDO (puerto 9090)" -ForegroundColor Green
        Write-Host "   - Access: http://localhost:9090" -ForegroundColor Gray
        
        # Intentar obtener targets
        try {
            $targetsResp = Invoke-WebRequest -Uri "http://localhost:9090/api/v1/targets" -TimeoutSec 3 -ErrorAction SilentlyContinue
            $targetsJson = $targetsResp.Content | ConvertFrom-Json
            $activeTargets = ($targetsJson.data.activeTargets | Measure-Object).Count
            Write-Host "   - Targets activos: $activeTargets" -ForegroundColor Gray
        } catch {
            Write-Host "   - Targets: no disponibles en el momento" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ PROMETHEUS: RESPONDE PERO CON ERROR (status: $($response.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ PROMETHEUS: NO RESPONDE - $_" -ForegroundColor Red
}
Write-Host ""

# 5. GRAFANA
Write-Host "[5/5] Verificando GRAFANA (puerto 3000)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 3 -ErrorAction SilentlyContinue
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ GRAFANA: FUNCIONANDO (puerto 3000)" -ForegroundColor Green
        Write-Host "   - Access: http://localhost:3000 (admin/admin por defecto)" -ForegroundColor Gray
        
        $healthJson = $response.Content | ConvertFrom-Json
        Write-Host "   - Status: $($healthJson.status)" -ForegroundColor Gray
    } else {
        Write-Host "❌ GRAFANA: RESPONDE PERO CON ERROR (status: $($response.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ GRAFANA: NO RESPONDE - $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verificación completada" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resumen de accesos:" -ForegroundColor Cyan
Write-Host "  Zookeeper:  localhost:2181" -ForegroundColor Gray
Write-Host "  Kafka:      localhost:9092" -ForegroundColor Gray
Write-Host "  RabbitMQ:   localhost:5672 (AMQP) / localhost:15672 (Web UI)" -ForegroundColor Gray
Write-Host "  Prometheus: http://localhost:9090" -ForegroundColor Gray
Write-Host "  Grafana:    http://localhost:3000" -ForegroundColor Gray
Write-Host ""
