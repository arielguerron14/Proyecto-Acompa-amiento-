#!/bin/bash

# =============================================================================
# 🔐 GitHub Secrets Manager Helper
# =============================================================================
# Script helper para facilitar la configuración de GitHub Secrets
# Uso: ./github-secrets-helper.sh
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# =============================================================================
# FUNCTIONS
# =============================================================================

print_header() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# =============================================================================
# MAIN MENU
# =============================================================================

show_menu() {
    print_header "GitHub Secrets Configuration Helper"
    echo "Selecciona una opción:"
    echo ""
    echo "1. 📋 Ver TODOS los secretos necesarios"
    echo "2. 📝 Generar formato para copiar cada secreto"
    echo "3. 🔍 Verificar si GitHub CLI está instalado"
    echo "4. 📄 Ver instrucciones de AWS_EC2_DB_SSH_PRIVATE_KEY"
    echo "5. 📄 Ver instrucciones de POSTGRES_PASSWORD_AWS"
    echo "6. 🚀 Comando para setup SSH local (preparación)"
    echo "7. ❌ Salir"
    echo ""
}

# =============================================================================
# OPTION FUNCTIONS
# =============================================================================

show_all_secrets() {
    print_header "✅ Secretos Necesarios en GitHub"
    
    echo "Debes configurar los siguientes 3 secretos en GitHub:"
    echo ""
    echo "┌─────────────────────────────────────────────────────────┐"
    echo "│ 1. AWS_EC2_DB_PRIVATE_IP                               │"
    echo "├─────────────────────────────────────────────────────────┤"
    echo "│ Descripción: IP privada de la instancia EC2-DB         │"
    echo "│ Valor de ejemplo: 172.31.79.193                        │"
    echo "│ Dónde obtenerlo:                                       │"
    echo "│   AWS Console → EC2 → Instancias → EC2-DB             │"
    echo "│   Copiar: \"IPv4 privada\" (columna Private IPs)        │"
    echo "└─────────────────────────────────────────────────────────┘"
    echo ""
    
    echo "┌─────────────────────────────────────────────────────────┐"
    echo "│ 2. AWS_EC2_DB_SSH_PRIVATE_KEY                          │"
    echo "├─────────────────────────────────────────────────────────┤"
    echo "│ Descripción: Contenido de la clave SSH privada (.pem)  │"
    echo "│ Dónde obtenerlo:                                       │"
    echo "│   1. Descargar .pem al crear EC2                       │"
    echo "│   2. Abrir archivo con: cat tu-clave.pem               │"
    echo "│   3. Copiar TODO el contenido (con ---- BEGIN/END ----│"
    echo "│ IMPORTANTE:                                            │"
    echo "│   • Incluir las líneas: -----BEGIN RSA PRIVATE KEY-----│"
    echo "│   • Incluir todas las líneas de en medio                │"
    echo "│   • Incluir: -----END RSA PRIVATE KEY-----             │"
    echo "│   • NO modificar el formato                            │"
    echo "└─────────────────────────────────────────────────────────┘"
    echo ""
    
    echo "┌─────────────────────────────────────────────────────────┐"
    echo "│ 3. POSTGRES_PASSWORD_AWS                               │"
    echo "├─────────────────────────────────────────────────────────┤"
    echo "│ Descripción: Contraseña para PostgreSQL                │"
    echo "│ Valor sugerido: Contraseña fuerte, ej:                │"
    echo "│   MySecureP@ssw0rd123!                                 │"
    echo "│ Requisitos:                                            │"
    echo "│   • Mínimo 12 caracteres                               │"
    echo "│   • Mayúsculas, minúsculas, números, símbolos         │"
    echo "│   • NO usar: comillas, backslash                       │"
    echo "└─────────────────────────────────────────────────────────┘"
    echo ""
    
    echo "Ubicación en GitHub:"
    echo "  1. Ir a: https://github.com/TU_USUARIO/TU_REPO"
    echo "  2. Settings → Secrets and variables → Actions"
    echo "  3. Click: New repository secret"
    echo "  4. Ingresar: Name (exactamente como arriba) + Value"
    echo ""
}

generate_secret_format() {
    print_header "📋 Formato para Copiar Secretos"
    
    echo "Sigue estos pasos para cada secreto:"
    echo ""
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "PASO 1: AWS_EC2_DB_PRIVATE_IP"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "En AWS Console:"
    echo "  EC2 → Instancias → EC2-DB → IPv4 privada"
    echo ""
    echo "Ejemplo (copiar sin comentario):"
    echo "  172.31.79.193"
    echo ""
    echo "En GitHub:"
    echo "  Name: AWS_EC2_DB_PRIVATE_IP"
    echo "  Value: [pegar la IP]"
    echo ""
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "PASO 2: AWS_EC2_DB_SSH_PRIVATE_KEY"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "En tu computadora:"
    echo "  Abrir: tu-clave.pem (archivo descargado de AWS)"
    echo "  Seleccionar TODO el contenido:"
    echo ""
    echo "  -----BEGIN RSA PRIVATE KEY-----"
    echo "  MIIEpAIBAAKCAQEA..."
    echo "  ... (muchas líneas)"
    echo "  -----END RSA PRIVATE KEY-----"
    echo ""
    echo "En GitHub:"
    echo "  Name: AWS_EC2_DB_SSH_PRIVATE_KEY"
    echo "  Value: [pegar TODO el contenido del .pem incluyendo BEGIN y END]"
    echo ""
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "PASO 3: POSTGRES_PASSWORD_AWS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Genera una contraseña fuerte:"
    echo ""
    if command -v openssl &> /dev/null; then
        echo "  Opción 1 (automático):"
        echo "  $ openssl rand -base64 16"
        echo "    $(openssl rand -base64 16)"
        echo ""
    fi
    echo "  Opción 2 (manual):"
    echo "  Usa caracteres: ABC123!@#"
    echo "  Ejemplo: MySecureP@ssw0rd123!"
    echo ""
    echo "En GitHub:"
    echo "  Name: POSTGRES_PASSWORD_AWS"
    echo "  Value: [la contraseña que generaste]"
    echo ""
    
    echo "✅ Después de crear los 3 secretos, verás un listado en:"
    echo "   Settings → Secrets and variables → Actions"
    echo ""
}

check_github_cli() {
    print_header "🔍 Verificación de GitHub CLI"
    
    if command -v gh &> /dev/null; then
        print_success "GitHub CLI está instalado"
        VERSION=$(gh --version)
        print_info "$VERSION"
        echo ""
        echo "Puedes usar GitHub CLI para configurar secretos:"
        echo ""
        echo "  # Login a GitHub"
        echo "  gh auth login"
        echo ""
        echo "  # Crear secretos"
        echo "  gh secret set AWS_EC2_DB_PRIVATE_IP --body '172.31.79.193' -R TU_USUARIO/TU_REPO"
        echo "  gh secret set AWS_EC2_DB_SSH_PRIVATE_KEY < tu-clave.pem -R TU_USUARIO/TU_REPO"
        echo "  gh secret set POSTGRES_PASSWORD_AWS --body 'tu-contraseña' -R TU_USUARIO/TU_REPO"
        echo ""
        echo "  # Listar secretos"
        echo "  gh secret list -R TU_USUARIO/TU_REPO"
        echo ""
    else
        print_warning "GitHub CLI no está instalado"
        echo ""
        echo "Para instalar GitHub CLI:"
        echo ""
        echo "  Windows (PowerShell):"
        echo "    choco install gh"
        echo "    # o"
        echo "    scoop install gh"
        echo ""
        echo "  macOS:"
        echo "    brew install gh"
        echo ""
        echo "  Linux:"
        echo "    # Seguir: https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
        echo ""
        echo "  Luego:"
        echo "    gh auth login"
        echo ""
    fi
}

show_ssh_key_instructions() {
    print_header "📄 Configuración de AWS_EC2_DB_SSH_PRIVATE_KEY"
    
    echo "La clave SSH se usa para conectarse a EC2-DB desde GitHub Actions."
    echo ""
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Paso 1: Obtener la clave .pem"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Cuando creaste la instancia EC2, AWS te permite descargar una clave:"
    echo "  AWS Console → EC2 → Key Pairs"
    echo "  Descargar el archivo .pem (ej: my-key.pem)"
    echo ""
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Paso 2: Ver el contenido de la clave"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "En PowerShell (Windows):"
    echo "  cat my-key.pem"
    echo "  # o"
    echo "  Get-Content my-key.pem"
    echo ""
    echo "En Terminal (Mac/Linux):"
    echo "  cat my-key.pem"
    echo ""
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Paso 3: Copiar el CONTENIDO COMPLETO"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "El contenido debe verse así:"
    echo ""
    echo "-----BEGIN RSA PRIVATE KEY-----"
    echo "MIIEpAIBAAKCAQEA3k3DvX9+qX2Z4z5jQ..."
    echo "..."
    echo "... (muchas líneas)"
    echo "..."
    echo "HjK2x8pQ=="
    echo "-----END RSA PRIVATE KEY-----"
    echo ""
    
    echo "🔴 IMPORTANTE:"
    echo "  • Incluir -----BEGIN RSA PRIVATE KEY-----"
    echo "  • Incluir -----END RSA PRIVATE KEY-----"
    echo "  • Copiar EXACTAMENTE tal como aparece (sin modificar)"
    echo "  • Incluir saltos de línea"
    echo ""
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Paso 4: Pegar en GitHub"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "1. Ir a: https://github.com/TU_USUARIO/TU_REPO"
    echo "2. Settings → Secrets and variables → Actions"
    echo "3. New repository secret"
    echo "4. Name: AWS_EC2_DB_SSH_PRIVATE_KEY"
    echo "5. Value: [Pegar TODO el contenido del .pem]"
    echo "6. Click: Add secret"
    echo ""
    
    echo "📝 Notas de seguridad:"
    echo "  • El secret estará encriptado en GitHub"
    echo "  • Solo se descifra durante la ejecución del workflow"
    echo "  • Los logs de GitHub Actions NO mostrarán el contenido"
    echo "  • Es seguro tenerlo como secret en GitHub"
    echo ""
}

show_postgres_password_instructions() {
    print_header "📄 Configuración de POSTGRES_PASSWORD_AWS"
    
    echo "Esta contraseña se usa para autenticarse en PostgreSQL."
    echo ""
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Paso 1: Generar una contraseña fuerte"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Opción A: Generar automáticamente"
    echo ""
    
    if command -v openssl &> /dev/null; then
        PASSWORD=$(openssl rand -base64 16)
        echo "  \$ openssl rand -base64 16"
        echo "  $PASSWORD"
        echo ""
    else
        echo "  \$ openssl rand -base64 16"
        echo "  [output de openssl]"
        echo ""
    fi
    
    echo "Opción B: Crear manualmente"
    echo "  Requisitos:"
    echo "    • Mínimo 12 caracteres"
    echo "    • Incluir: mayúsculas (ABC), minúsculas (xyz), números (123), símbolos (!@#)"
    echo ""
    echo "  Ejemplos válidos:"
    echo "    MySecureP@ssw0rd123!"
    echo "    P@ssw0rd#Admin2026"
    echo "    SecurePostgres\$2026!"
    echo ""
    
    echo "❌ NO usar:"
    echo "  • Comillas simples o dobles: ' \" "
    echo "  • Backslash: \\"
    echo "  • Semicolon: ;"
    echo "  • Espacios en blanco"
    echo ""
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Paso 2: Guardar la contraseña en lugar seguro"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "⚠️  IMPORTANTE: Guarda la contraseña en lugar seguro"
    echo "  Opciones:"
    echo "    • Gestor de contraseñas (1Password, LastPass, Bitwarden)"
    echo "    • Archivo encriptado local"
    echo "    • Nota privada en lugar seguro"
    echo ""
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Paso 3: Configurar en GitHub"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "1. Ir a: https://github.com/TU_USUARIO/TU_REPO"
    echo "2. Settings → Secrets and variables → Actions"
    echo "3. New repository secret"
    echo "4. Name: POSTGRES_PASSWORD_AWS"
    echo "5. Value: [Tu contraseña]"
    echo "6. Click: Add secret"
    echo ""
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Paso 4: Usar en .env después del despliegue"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "En .env (en EC2-Microservicios):"
    echo "  POSTGRES_PASSWORD=MySecureP@ssw0rd123!"
    echo ""
    echo "En .env (en EC2-DB):"
    echo "  POSTGRES_PASSWORD=MySecureP@ssw0rd123!"
    echo ""
    echo "Nota: Ambos deben usar la MISMA contraseña"
    echo ""
}

show_ssh_setup() {
    print_header "🚀 Comando para Setup SSH Local"
    
    echo "Si quieres acceder a las instancias EC2 desde tu computadora:"
    echo ""
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Paso 1: Guardar la clave en lugar seguro"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Windows (PowerShell):"
    echo "  # Crear directorio"
    echo "  mkdir \$HOME\\.ssh"
    echo ""
    echo "  # Copiar la clave (asume que está en Downloads)"
    echo "  Copy-Item ~\\Downloads\\my-key.pem ~\\.ssh\\"
    echo ""
    echo "  # Cambiar permisos"
    echo "  icacls \$HOME\\.ssh\\my-key.pem /inheritance:r /grant:r \$env:USERNAME /F"
    echo ""
    
    echo "Mac/Linux:"
    echo "  mkdir -p ~/.ssh"
    echo "  cp ~/Downloads/my-key.pem ~/.ssh/"
    echo "  chmod 600 ~/.ssh/my-key.pem"
    echo ""
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Paso 2: Conectar a EC2-DB"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "  ssh -i ~/.ssh/my-key.pem ec2-user@IP_PUBLICA_EC2_DB"
    echo ""
    echo "Ejemplo:"
    echo "  ssh -i ~/.ssh/my-key.pem ec2-user@54.123.45.67"
    echo ""
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Paso 3: Conectar a EC2-Microservicios"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "  ssh -i ~/.ssh/my-key.pem ec2-user@IP_PUBLICA_EC2_MICROSERVICIOS"
    echo ""
    echo "Ejemplo:"
    echo "  ssh -i ~/.ssh/my-key.pem ec2-user@54.234.56.78"
    echo ""
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Paso 4: Configurar alias (opcional pero recomendado)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    if [[ \"\$OSTYPE\" == \"msys\" ]] || [[ \"\$OSTYPE\" == \"cygwin\" ]]; then
        echo "Windows PowerShell (agregar a tu perfil):"
        echo "  # Editar: \$PROFILE"
        echo "  notepad \$PROFILE"
        echo ""
        echo "  # Agregar al final:"
        echo "  function sshdb { ssh -i ~/.ssh/my-key.pem ec2-user@54.123.45.67 }"
        echo "  function sshmicro { ssh -i ~/.ssh/my-key.pem ec2-user@54.234.56.78 }"
        echo ""
        echo "  # Luego usar:"
        echo "  sshdb"
        echo "  sshmicro"
        echo ""
    else
        echo "Mac/Linux (agregar a ~/.bashrc o ~/.zshrc):"
        echo "  alias sshdb='ssh -i ~/.ssh/my-key.pem ec2-user@54.123.45.67'"
        echo "  alias sshmicro='ssh -i ~/.ssh/my-key.pem ec2-user@54.234.56.78'"
        echo ""
        echo "  # Luego usar:"
        echo "  sshdb"
        echo "  sshmicro"
        echo ""
    fi
}

# =============================================================================
# MAIN LOOP
# =============================================================================

while true; do
    show_menu
    read -p "Selecciona opción (1-7): " option
    
    case $option in
        1)
            show_all_secrets
            ;;
        2)
            generate_secret_format
            ;;
        3)
            check_github_cli
            ;;
        4)
            show_ssh_key_instructions
            ;;
        5)
            show_postgres_password_instructions
            ;;
        6)
            show_ssh_setup
            ;;
        7)
            print_info "¡Adiós!"
            exit 0
            ;;
        *)
            print_error "Opción no válida. Por favor, selecciona 1-7."
            ;;
    esac
    
    echo ""
    read -p "Presiona Enter para continuar..."
done
