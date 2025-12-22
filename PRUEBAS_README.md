# 🧪 Sistema de Pruebas - Acompañamiento

## 🚀 Inicio Rápido

He creado un servidor de pruebas simplificado que permite probar las funcionalidades básicas del sistema:

### **Servidor de Pruebas**
- **URL del servidor**: `http://localhost:3000`
- **Estado**: ✅ Ejecutándose

### **Interfaz de Pruebas**
- **Archivo**: `test-api.html`
- **Cómo abrir**: Abre el archivo `test-api.html` en tu navegador web

## 📋 Funcionalidades Disponibles

### 1. **Crear Horarios de Maestro** 📅
- **Endpoint**: `POST /horarios`
- **Campos requeridos**:
  - `maestroId`: ID del maestro
  - `maestroName`: Nombre del maestro
  - `semestre`: Número del semestre (1-5)
  - `materia`: Código de la materia
  - `paralelo`: Paralelo (A, B, C, etc.)
  - `dia`: Día de la semana
  - `inicio`: Hora de inicio (HH:MM)
  - `fin`: Hora de fin (HH:MM)

### 2. **Reservar Horarios como Estudiante** 🎯
- **Endpoint**: `POST /estudiantes/reservar`
- **Campos requeridos**:
  - `estudianteId`: ID del estudiante
  - `estudianteName`: Nombre del estudiante
  - `maestroId`: ID del maestro
  - `dia`: Día del horario
  - `inicio`: Hora de inicio
  - `fin`: Hora de fin

### 3. **Listar Horarios** 📋
- **Todos los horarios**: `GET /horarios`
- **Horarios por maestro**: `GET /horarios/maestro/{maestroId}`
- **Reportes**: `GET /horarios/reportes/{maestroId}`

## 🎮 Cómo Probar

### **Opción 1: Interfaz Web (Recomendada)**
1. Abre el archivo `test-api.html` en tu navegador
2. Usa las pestañas para navegar entre funcionalidades:
   - **"Crear Horarios"**: Crea nuevos horarios de atención
   - **"Reservar Horarios"**: Carga y reserva horarios disponibles
   - **"Listar Horarios"**: Ve todos los horarios creados

### **Opción 2: API Directa (Avanzado)**
Usa curl o Postman para probar los endpoints directamente:

```bash
# Crear un horario
curl -X POST http://localhost:3000/horarios \
  -H "Content-Type: application/json" \
  -d '{
    "maestroId": "maestro123",
    "maestroName": "Prof. García",
    "semestre": "1",
    "materia": "MAT101",
    "paralelo": "A",
    "dia": "Lunes",
    "inicio": "08:00",
    "fin": "10:00"
  }'

# Listar todos los horarios
curl http://localhost:3000/horarios

# Reservar un horario
curl -X POST http://localhost:3000/estudiantes/reservar \
  -H "Content-Type: application/json" \
  -d '{
    "estudianteId": "estudiante123",
    "estudianteName": "Juan Pérez",
    "maestroId": "maestro123",
    "dia": "Lunes",
    "inicio": "08:00",
    "fin": "10:00"
  }'
```

## ✅ Validaciones Implementadas

- **Campos requeridos**: Todos los campos obligatorios son validados
- **Conflicto de horarios**: No permite crear horarios que se solapen para el mismo maestro
- **Reservas duplicadas**: No permite reservar el mismo horario dos veces
- **Horarios inexistentes**: Valida que el horario exista antes de reservar

## 🔍 Verificación del Estado

Para verificar que el servidor está funcionando:

```bash
curl http://localhost:3000/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "service": "test-api",
  "horarios": 0,
  "reservas": 0
}
```

## 📊 Datos de Prueba Sugeridos

### **Horarios de Ejemplo**:
- Maestro: `maestro123`, "Prof. García"
- Materia: `MAT101`, Paralelo: `A`
- Horario: Lunes 08:00-10:00

### **Estudiante de Ejemplo**:
- ID: `estudiante123`
- Nombre: `Juan Pérez`

## 🚨 Notas Importantes

1. **Datos en memoria**: Los datos se pierden al reiniciar el servidor
2. **Sin persistencia**: Esta es una versión de prueba, no guarda datos permanentemente
3. **Sin autenticación**: No requiere tokens JWT para simplificar las pruebas
4. **Validaciones básicas**: Incluye las validaciones esenciales pero no todas las del sistema completo

## 🎯 Próximos Pasos

Una vez que confirmes que estas funcionalidades básicas funcionan, podemos:

1. **Corregir los microservicios originales** para que funcionen con Docker
2. **Implementar persistencia** con MongoDB/PostgreSQL
3. **Agregar autenticación JWT**
4. **Integrar con el frontend completo**

---

**¡Listo para probar!** Abre `test-api.html` en tu navegador y comienza a crear horarios y hacer reservas. 🎉