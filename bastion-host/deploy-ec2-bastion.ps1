# Bastion Host - Despliegue en EC2 (PowerShell)
# Ejecutar: ssh -i key-acompanamiento.pem ec2-user@3.87.155.74
# Luego: pwsh -File deploy-ec2-bastion.ps1

param(
    [string]$EC2_IP = "3.87.155.74",
    [string]$EC2_KEY = "key-acompanamiento.pem"
)

Write-Host "=========================================="
Write-Host "Bastion Host - EC2 Auto-Deploy (PowerShell)"
Write-Host "=========================================="
Write-Host "Instancia: i-0bd13b8e83e8679bb (t3.small)"
Write-Host "IP: $EC2_IP"
Write-Host "Usuario: ec2-user"
Write-Host ""

# Función para ejecutar comandos remotos
function Invoke-EC2Command {
    param(
        [string]$Command,
        [string]$IP = $EC2_IP,
        [string]$Key = $EC2_KEY
    )
    
    ssh.exe -i "$Key" -o StrictHostKeyChecking=no ec2-user@"$IP" "$Command"
}

try {
    # 1. Verificar conectividad
    Write-Host "[PASO 1] Verificando conectividad..."
    Invoke-EC2Command "echo OK" | Out-Null
    Write-Host "  ✓ Conexión SSH establecida"
    Write-Host ""
    
    # 2. Instalar Docker
    Write-Host "[PASO 2] Instalando Docker..."
    Invoke-EC2Command "sudo yum update -y && sudo yum install docker git -y && sudo systemctl start docker && sudo systemctl enable docker && sudo usermod -aG docker ec2-user" | Out-Null
    Write-Host "  ✓ Docker instalado"
    Write-Host ""
    
    # 3. Instalar Docker Compose
    Write-Host "[PASO 3] Instalando Docker Compose..."
    Invoke-EC2Command "sudo curl -L 'https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-Linux-x86_64' -o /usr/local/bin/docker-compose && sudo chmod +x /usr/local/bin/docker-compose" | Out-Null
    Write-Host "  ✓ Docker Compose instalado"
    Write-Host ""
    
    # 4. Clonar repositorio
    Write-Host "[PASO 4] Clonando repositorio..."
    Invoke-EC2Command "[ -d 'Proyecto-Acompa-amiento-' ] || git clone https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git" | Out-Null
    Write-Host "  ✓ Repositorio listo"
    Write-Host ""
    
    # 5. Desplegar Bastion
    Write-Host "[PASO 5] Desplegando Bastion Host..."
    Invoke-EC2Command "cd ~/Proyecto-Acompa-amiento-/bastion-host && docker-compose down -v 2>/dev/null || true && docker-compose up -d && sleep 3" | Out-Null
    Write-Host "  ✓ Contenedor desplegado"
    Write-Host ""
    
    # 6. Verificaciones
    Write-Host "[PASO 6] Verificando despliegue..."
    $status = Invoke-EC2Command "docker ps | grep bastion-host && echo 'RUNNING' || echo 'FAILED'"
    if ($status -contains "RUNNING") {
        Write-Host "  ✓ Bastion Host está corriendo"
    } else {
        Write-Host "  ✗ ERROR: Contenedor no está corriendo"
        Write-Host "  Logs:"
        Invoke-EC2Command "docker logs bastion-host | tail -10"
        exit 1
    }
    
    $portMapping = Invoke-EC2Command "docker port bastion-host"
    Write-Host "  ✓ Puerto mapeado: $portMapping"
    Write-Host ""
    
    Write-Host "=========================================="
    Write-Host "✅ Despliegue completado exitosamente"
    Write-Host "=========================================="
    Write-Host ""
    Write-Host "Bastion Host disponible en:"
    Write-Host "  IP: $EC2_IP"
    Write-Host "  Puerto SSH: 2222"
    Write-Host "  Usuario: root"
    Write-Host ""
    Write-Host "Conectar desde cliente:"
    Write-Host "  ssh -p 2222 -i bastion-key.pem root@$EC2_IP"
    Write-Host ""
    
} catch {
    Write-Host "✗ Error durante el despliegue: $_"
    exit 1
}
