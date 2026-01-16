#!/bin/bash
# Script para ejecutar en la instancia EC2
# Instala todo lo necesario y despliega los servicios

set -e

echo "📥 Clonando repositorio..."
cd /tmp
rm -rf proyecto 2>/dev/null || true
git clone --depth 1 https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git proyecto
cd proyecto

echo ""
echo "🏗️ Compilando Docker images para EC2-CORE..."
echo "Compilando micro-auth..."
docker build -t micro-auth:latest -f ./micro-auth/Dockerfile . > /dev/null 2>&1 &
PID1=$!

echo "Compilando micro-estudiantes..."
docker build -t micro-estudiantes:latest -f ./micro-estudiantes/Dockerfile . > /dev/null 2>&1 &
PID2=$!

echo "Compilando micro-maestros..."
docker build -t micro-maestros:latest -f ./micro-maestros/Dockerfile . > /dev/null 2>&1 &
PID3=$!

echo "Compilando micro-core..."
docker build -t micro-core:latest -f ./micro-core/Dockerfile . > /dev/null 2>&1 &
PID4=$!

echo "Esperando a que terminen las compilaciones..."
wait $PID1 $PID2 $PID3 $PID4
echo "✅ Compilaciones completadas"

echo ""
echo "📋 Preparando docker-compose..."
mkdir -p ~/app
cp docker-compose.ec2-core.yml ~/app/docker-compose.yml

echo ""
echo "🚀 Iniciando servicios..."
cd ~/app
docker-compose down 2>/dev/null || true
sleep 2
docker-compose up -d
sleep 15

echo ""
echo "✅ DESPLIEGUE COMPLETADO"
echo ""
echo "📊 Estado de servicios:"
docker-compose ps

echo ""
echo "🔗 Servicios disponibles:"
docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"
