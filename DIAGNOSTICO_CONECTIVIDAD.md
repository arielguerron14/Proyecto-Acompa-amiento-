# Diagnóstico: API Gateway no puede conectar a Microservicios

## Problema Actual
- API Gateway (35.168.216.132:8080) intenta conectar a micro-auth en 172.31.65.0:3000
- Error: `ECONNREFUSED 172.31.65.0:3000`
- **ECONNREFUSED** = La conexión fue rechazada, no es DNS

## Causas Potenciales

### 1. Puerto No Expuesto en Todas las Interfaces ❌ (SOLUCIONADO)
**Antes**: `-p 3000:3000` solo expone en localhost (127.0.0.1)
**Ahora**: `-p 0.0.0.0:3000:3000` expone en todas las interfaces
- ✅ Actualizado en deploy-microservices.py
- ✅ Actualizado en docker-compose.ec2-core.yml
- ✅ Actualizado en deploy-ec2-core.yml workflow
- ⏳ Esperando que el workflow complete

### 2. Security Group permite trafico entre instancias?
**Verificar**: EC2-CORE debe permitir tráfico de entrada desde EC2-API-Gateway en puertos 3000-3002

**Revisar en AWS Console**:
- EC2 → Security Groups
- Buscar security group de EC2-CORE
- Inbound rules debe tener:
  - Port 3000 from EC2-API-Gateway security group (o 35.168.216.132/32)
  - Port 3001 from EC2-API-Gateway security group (o 35.168.216.132/32)
  - Port 3002 from EC2-API-Gateway security group (o 35.168.216.132/32)

### 3. Firewall en EC2-CORE (iptables/firewalld)?
**Verificar**: En EC2-CORE, ¿qué está escuchando en 3000?

Ejecutar en EC2-CORE:
```bash
netstat -tlnp | grep 3000
# o
ss -tlnp | grep 3000
```

Resultado esperado:
```
tcp        0      0 0.0.0.0:3000            0.0.0.0:*               LISTEN      1234/docker
```

### 4. Contenedor está escuchando en localhost en lugar de 0.0.0.0?
Verificar en EC2-CORE:
```bash
docker exec micro-auth netstat -tlnp | grep 3000
# Debe mostrar:
tcp        0      0 0.0.0.0:3000            0.0.0.0:*               LISTEN
```

## Próximos Pasos

1. **Esperar que el workflow complete** (~2 minutos más)
2. **Probar conectividad**: `curl http://35.168.216.132:8080/auth/register`
3. **Si aún falla**:
   - Ejecutar diagnóstico en EC2-CORE via AWS Systems Manager
   - Verificar security groups en AWS Console
   - Revisar logs del contenedor: `docker logs micro-auth`

## Timeline
- 17:47 UTC: Error inicial `ENOTFOUND micro-auth` (DNS issue)
- 17:50 UTC: Cambió a `ECONNREFUSED 172.31.65.0:3000` (port not exposed)
- 17:53 UTC: Actualizado workflow con 0.0.0.0
- **⏳ Esperando deployment...** (debe terminar ~17:56 UTC)
