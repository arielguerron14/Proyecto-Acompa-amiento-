# bastion-connect.ps1 - Script para conectar al Bastion Host (Windows)
# Uso: .\bastion-connect.ps1 -Command connect -Target core

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('connect', 'list', 'tunnel', 'status', 'exec', 'help')]
    [string]$Command = 'help',
    
    [Parameter(Mandatory=$false)]
    [string]$Target = 'bastion',
    
    [Parameter(Mandatory=$false)]
    [string]$ExtraArg,
    
    [Parameter(Mandatory=$false)]
    [string]$BastionIP = '54.172.74.210',
    
    [Parameter(Mandatory=$false)]
    [string]$BastionUser = 'ec2-user',
    
    [Parameter(Mandatory=$false)]
    [string]$BastionKey = './ssh-key-bastion.pem'
)

# Instancias conocidas
$Instances = @{
    'bastion'       = '54.172.74.210'
    'core'          = '3.234.198.34'
    'db'            = '3.237.32.106'
    'frontend'      = '54.85.92.175'
    'api-gateway'   = '35.168.216.132'
    'messaging'     = '34.207.206.13'
    'monitoring'    = '34.203.175.72'
    'notificaciones'= '35.175.200.15'
    'reportes'      = '3.94.74.223'
}

$PrivateIPs = @{
    'core'    = '172.31.66.255'
    'db'      = '172.31.78.151'
    'frontend'= '172.31.70.190'
}

# Función para mostrar ayuda
function Show-Help {
    Write-Host "=== Bastion Host Connection Tool (Windows) ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Uso: .\bastion-connect.ps1 -Command <comando> [opciones]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Comandos disponibles:"
    Write-Host "  connect [target]    - Conectar a una instancia via Bastion"
    Write-Host "  list                - Listar instancias disponibles"
    Write-Host "  tunnel [servicio]   - Crear túnel SSH para un servicio"
    Write-Host "  status              - Verificar estado del Bastion"
    Write-Host "  exec [instancia] [cmd] - Ejecutar comando en instancia"
    Write-Host "  help                - Mostrar esta ayuda"
    Write-Host ""
    Write-Host "Instancias disponibles:"
    foreach ($inst in $Instances.Keys) {
        Write-Host "  - $inst ($($Instances[$inst]))" -ForegroundColor Green
    }
    Write-Host ""
    Write-Host "Ejemplos:"
    Write-Host "  .\bastion-connect.ps1 -Command connect -Target core"
    Write-Host "  .\bastion-connect.ps1 -Command tunnel -Target api-gateway"
    Write-Host "  .\bastion-connect.ps1 -Command status"
    Write-Host ""
}

# Validar que la clave existe
if (-not (Test-Path $BastionKey)) {
    Write-Host "❌ Error: Archivo de clave no encontrado: $BastionKey" -ForegroundColor Red
    exit 1
}

# Función: conectar
function Invoke-Connect {
    param([string]$Target)
    
    if (-not $Instances.ContainsKey($Target)) {
        Write-Host "❌ Instancia desconocida: $Target" -ForegroundColor Red
        exit 1
    }
    
    $targetIP = $Instances[$Target]
    
    if ($Target -eq 'bastion') {
        Write-Host "🔗 Conectando al Bastion Host..." -ForegroundColor Green
        & ssh -i $BastionKey "$BastionUser@$BastionIP"
    } else {
        Write-Host "🔗 Conectando a $Target ($targetIP) via Bastion..." -ForegroundColor Green
        
        & ssh -i $BastionKey `
            -o "StrictHostKeyChecking=no" `
            -J "$BastionUser@$BastionIP" `
            "ubuntu@$targetIP"
    }
}

# Función: listar
function Invoke-List {
    Write-Host "=== Instancias Disponibles ===" -ForegroundColor Cyan
    Write-Host ""
    
    $table = @()
    foreach ($inst in $Instances.Keys) {
        $pubIP = $Instances[$inst]
        $privIP = if ($PrivateIPs.ContainsKey($inst)) { $PrivateIPs[$inst] } else { "N/A" }
        
        $table += [PSCustomObject]@{
            Nombre     = $inst
            'IP Pública' = $pubIP
            'IP Privada' = $privIP
        }
    }
    
    $table | Format-Table -AutoSize
}

# Función: túnel
function Invoke-Tunnel {
    param([string]$Service)
    
    $service = if ([string]::IsNullOrEmpty($Service)) { 'api-gateway' } else { $Service }
    
    $config = @{
        'mongodb'    = @{ Port = 27017; IP = $Instances['db']; RemotePort = 27017; Name = 'MongoDB' }
        'api-gateway'= @{ Port = 8080;  IP = $Instances['api-gateway']; RemotePort = 8080; Name = 'API Gateway' }
        'grafana'    = @{ Port = 3000;  IP = $Instances['monitoring']; RemotePort = 3000; Name = 'Grafana' }
        'prometheus' = @{ Port = 9090;  IP = $Instances['monitoring']; RemotePort = 9090; Name = 'Prometheus' }
        'rabbitmq'   = @{ Port = 5672;  IP = $Instances['messaging']; RemotePort = 5672; Name = 'RabbitMQ' }
    }
    
    if (-not $config.ContainsKey($service)) {
        Write-Host "❌ Servicio desconocido: $service" -ForegroundColor Red
        exit 1
    }
    
    $cfg = $config[$service]
    Write-Host "🔗 Creando túnel a $($cfg.Name)..." -ForegroundColor Green
    Write-Host "📡 Túnel: localhost:$($cfg.Port) -> $($cfg.IP):$($cfg.RemotePort)" -ForegroundColor Yellow
    Write-Host "⏸️  Presiona Ctrl+C para cerrar el túnel" -ForegroundColor Yellow
    Write-Host ""
    
    & ssh -i $BastionKey `
        -L "$($cfg.Port):$($cfg.IP):$($cfg.RemotePort)" `
        "$BastionUser@$BastionIP" `
        "echo 'Túnel SSH abierto. Presiona Ctrl+C para cerrar.' ; sleep 86400"
}

# Función: estado
function Invoke-Status {
    Write-Host "=== Estado del Bastion Host ===" -ForegroundColor Cyan
    Write-Host ""
    
    $result = & ssh -i $BastionKey -o "ConnectTimeout=5" "$BastionUser@$BastionIP" "exit" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Bastion Host está accesible" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "Sistema Operativo:" -ForegroundColor Cyan
        & ssh -i $BastionKey "$BastionUser@$BastionIP" "cat /etc/os-release | grep PRETTY_NAME"
        
        Write-Host ""
        Write-Host "Usuarios conectados:" -ForegroundColor Cyan
        & ssh -i $BastionKey "$BastionUser@$BastionIP" "who"
        
        Write-Host ""
        Write-Host "Últimas conexiones SSH:" -ForegroundColor Cyan
        & ssh -i $BastionKey "$BastionUser@$BastionIP" "last -5" 2>&1 | Select-Object -First 10
        
    } else {
        Write-Host "❌ No se puede conectar al Bastion Host" -ForegroundColor Red
        exit 1
    }
}

# Función: ejecutar
function Invoke-Exec {
    param([string]$TargetHost, [string]$Command)
    
    if ([string]::IsNullOrEmpty($TargetHost) -or [string]::IsNullOrEmpty($Command)) {
        Write-Host "❌ Uso: Invoke-Exec -TargetHost <instancia> -Command <comando>" -ForegroundColor Red
        exit 1
    }
    
    if (-not $Instances.ContainsKey($TargetHost)) {
        Write-Host "❌ Instancia desconocida: $TargetHost" -ForegroundColor Red
        exit 1
    }
    
    $targetIP = $Instances[$TargetHost]
    
    Write-Host "⚙️  Ejecutando en $TargetHost : $Command" -ForegroundColor Green
    Write-Host ""
    
    & ssh -i $BastionKey `
        -o "StrictHostKeyChecking=no" `
        -J "$BastionUser@$BastionIP" `
        "ubuntu@$targetIP" `
        $Command
}

# Main
switch ($Command) {
    'connect' {
        Invoke-Connect -Target $Target
    }
    'list' {
        Invoke-List
    }
    'tunnel' {
        Invoke-Tunnel -Service $Target
    }
    'status' {
        Invoke-Status
    }
    'exec' {
        Invoke-Exec -TargetHost $Target -Command $ExtraArg
    }
    'help' {
        Show-Help
    }
    default {
        Write-Host "❌ Comando desconocido: $Command" -ForegroundColor Red
        Show-Help
        exit 1
    }
}
