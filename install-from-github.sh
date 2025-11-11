#!/usr/bin/env bash

##
## Script de instalación de n8n-nodes-pdfbox desde GitHub
## Compila e instala el nodo directamente en el contenedor n8n
##

set -euo pipefail

CONTAINER_NAME="n8n-n8n-1"
REPO_URL="https://github.com/pablopescador/n8n-nodes-pdfbox.git"
NODE_DIR="/tmp/n8n-nodes-pdfbox"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Instalación n8n-nodes-pdfbox desde GitHub                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Instalar git en el contenedor si no existe
echo "[1/6] Verificando git en contenedor..."
docker exec "${CONTAINER_NAME}" sh -c "command -v git || apk add --no-cache git"

# Clonar repositorio
echo ""
echo "[2/6] Clonando repositorio..."
docker exec "${CONTAINER_NAME}" sh -c "rm -rf ${NODE_DIR} && git clone ${REPO_URL} ${NODE_DIR}"

# Instalar dependencias
echo ""
echo "[3/6] Instalando dependencias..."
docker exec "${CONTAINER_NAME}" sh -c "cd ${NODE_DIR} && npm install"

# Compilar TypeScript
echo ""
echo "[4/6] Compilando TypeScript..."
docker exec "${CONTAINER_NAME}" sh -c "cd ${NODE_DIR} && npm run build"

# Copiar a directorio de nodos custom
echo ""
echo "[5/6] Instalando nodo..."
docker exec "${CONTAINER_NAME}" sh -c "mkdir -p /home/node/.n8n/nodes && cp -r ${NODE_DIR} /home/node/.n8n/nodes/"

# Limpiar
echo ""
echo "[6/6] Limpiando archivos temporales..."
docker exec "${CONTAINER_NAME}" sh -c "rm -rf ${NODE_DIR}"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✅ Instalación completada                                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  IMPORTANTE: Reinicia n8n para que el nodo aparezca"
echo ""
echo "  docker compose -f /home/pablo/n8n/docker-compose.yml restart n8n"
echo ""
