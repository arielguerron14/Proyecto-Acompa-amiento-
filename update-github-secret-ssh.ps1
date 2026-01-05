# Script para actualizar el secret AWS_EC2_CORE_SSH_PRIVATE_KEY en GitHub
# Uso: .\update-github-secret-ssh.ps1 -KeyPath "C:\path\to\key-acompanamiento.pem" -Token "your_github_token"

param(
    [Parameter(Mandatory = $true)]
    [string]$KeyPath,
    
    [Parameter(Mandatory = $true)]
    [string]$Token,
    
    [string]$Owner = "arielguerron14",
    [string]$Repo = "Proyecto-Acompa-amiento-",
    [string]$SecretName = "AWS_EC2_CORE_SSH_PRIVATE_KEY"
)

# Validar que el archivo existe
if (-not (Test-Path $KeyPath)) {
    Write-Error "El archivo de clave SSH no existe: $KeyPath"
    exit 1
}

# Leer el contenido de la clave
Write-Host "Leyendo clave SSH desde: $KeyPath"
$keyContent = Get-Content -Path $KeyPath -Raw

# Validar que es una clave RSA válida
if ($keyContent -notmatch "BEGIN RSA PRIVATE KEY|BEGIN OPENSSH PRIVATE KEY|BEGIN PRIVATE KEY") {
    Write-Error "El archivo no parece ser una clave privada válida"
    exit 1
}

Write-Host "Clave SSH detectada como válida"
Write-Host ""

# Mostrar el contenido (primeras y últimas líneas para verificación)
$lines = $keyContent -split "`n"
Write-Host "Formato de clave:"
Write-Host "Línea 1: $($lines[0])"
Write-Host "Línea última: $($lines[$lines.Length - 2])"
Write-Host ""

# Base64 encode para enviarlo a GitHub API
$base64Content = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($keyContent))

# Headers para GitHub API
$headers = @{
    "Authorization" = "Bearer $Token"
    "Accept" = "application/vnd.github.v3+json"
    "Content-Type" = "application/json"
}

# Body del request
$body = @{
    "encrypted_value" = $base64Content
    "key_id" = ""
} | ConvertTo-Json

Write-Host "Actualizando secret en GitHub..."
Write-Host "Owner: $Owner"
Write-Host "Repo: $Repo"
Write-Host "Secret: $SecretName"
Write-Host ""

# Nota: Para obtener la public key necesaria para encriptar
# primero hay que hacer GET a /repos/{owner}/{repo}/actions/secrets/public-key

try {
    # Primero obtener la public key
    $publicKeyUrl = "https://api.github.com/repos/$Owner/$Repo/actions/secrets/public-key"
    Write-Host "Obteniendo public key desde: $publicKeyUrl"
    
    $publicKeyResponse = Invoke-WebRequest -Uri $publicKeyUrl -Headers $headers -Method Get
    $publicKeyData = $publicKeyResponse.Content | ConvertFrom-Json
    $publicKeyId = $publicKeyData.key_id
    $publicKey = $publicKeyData.key
    
    Write-Host "Public Key ID: $publicKeyId"
    Write-Host ""
    
    # Como la encriptación requiere libsodium, mostramos instrucciones alternativas
    Write-Host "⚠️  INSTRUCCIONES MANUALES (Recomendado):"
    Write-Host ""
    Write-Host "1. Ve a: https://github.com/$Owner/$Repo/settings/secrets/actions"
    Write-Host "2. Haz clic en 'New repository secret'"
    Write-Host "3. Nombre: $SecretName"
    Write-Host "4. Valor: Copia TODO el contenido del archivo '$KeyPath'"
    Write-Host "5. Haz clic en 'Add secret'"
    Write-Host ""
    Write-Host "Para obtener el contenido, ejecuta:"
    Write-Host "Get-Content -Path '$KeyPath' -Raw | Set-Clipboard"
    Write-Host ""
    
} catch {
    Write-Error "Error al conectar con GitHub API: $_"
    Write-Host ""
    Write-Host "⚠️  INSTRUCCIONES MANUALES:"
    Write-Host "1. Ve a: https://github.com/$Owner/$Repo/settings/secrets/actions"
    Write-Host "2. Haz clic en 'New repository secret'"
    Write-Host "3. Nombre: $SecretName"
    Write-Host "4. Valor: Copia TODO el contenido del archivo '$KeyPath'"
    Write-Host "5. Haz clic en 'Add secret'"
    exit 1
}
