#!/usr/bin/env python3
"""
Dispara el workflow setup-deploy-all en GitHub Actions
"""
import os
import json
import sys

def trigger_workflow(repo, workflow_name, setup_db=True, deploy_core=True):
    """Dispara un workflow en GitHub Actions"""
    
    github_token = os.environ.get("GITHUB_TOKEN")
    if not github_token:
        print("❌ ERROR: GITHUB_TOKEN no establecido")
        print("   Necesita un Personal Access Token de GitHub con permisos de 'workflow'")
        sys.exit(1)
    
    # Usar curl para disparar el workflow
    import subprocess
    
    url = f"https://api.github.com/repos/{repo}/actions/workflows/{workflow_name}/dispatches"
    
    payload = {
        "ref": "main",
        "inputs": {
            "setup_db": "true" if setup_db else "false",
            "deploy_core": "true" if deploy_core else "false"
        }
    }
    
    cmd = [
        "curl",
        "-X", "POST",
        "-H", f"Authorization: token {github_token}",
        "-H", "Accept: application/vnd.github.v3+json",
        "-d", json.dumps(payload),
        url
    ]
    
    print(f"🔄 Disparando workflow: {workflow_name}")
    print(f"📍 Repo: {repo}")
    print(f"⚙️  Setup DB: {setup_db}")
    print(f"🚀 Deploy Core: {deploy_core}")
    print()
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            response = json.loads(result.stdout) if result.stdout else {}
            if "status" in response or result.returncode == 0:
                print("✅ Workflow disparado exitosamente!")
                print()
                print("📊 Puedes ver el progreso en:")
                print(f"   https://github.com/{repo}/actions")
                print()
                print("⏱️  El workflow tardará ~5-10 minutos en completarse")
                print()
                print("📋 Pasos que ejecutará:")
                print("   1. Setup MongoDB en EC2-DB con credenciales")
                print("   2. Esperar a que MongoDB esté listo")
                print("   3. Descargar imágenes Docker en EC2-CORE")
                print("   4. Crear network core-net")
                print("   5. Iniciar micro-auth, micro-estudiantes, micro-maestros")
                print("   6. Verificar que todos los contenedores están corriendo")
                print()
                return True
            else:
                print(f"⚠️  Response: {result.stdout}")
                return False
        else:
            print(f"❌ Error: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error al disparar workflow: {e}")
        return False

if __name__ == "__main__":
    repo = "arielguerron14/Proyecto-Acompa-amiento-"
    workflow = "setup-deploy-all.yml"
    
    success = trigger_workflow(repo, workflow, setup_db=True, deploy_core=True)
    
    if success:
        print("\n✅ Esperando a que finalice el workflow...")
        print("   Esto puede tomar varios minutos.")
        print()
        print("🔍 Para monitorear:")
        print("   1. Ve a GitHub Actions")
        print("   2. Busca 'Setup & Deploy Everything'")
        print("   3. Verifica el estado de cada step")
    
    sys.exit(0 if success else 1)
