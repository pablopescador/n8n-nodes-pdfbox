#!/usr/bin/env bash

##
## Post-install script - Instalación de Apache PDFBox en contenedor n8n
## Se ejecuta automáticamente después de npm install
##

set -euo pipefail

echo "================================================"
echo "  n8n-nodes-pdfbox - Post-install"
echo "================================================"
echo ""
echo "⚠️  REQUISITOS:"
echo ""
echo "1. Java 17+ debe estar instalado en el contenedor n8n"
echo "2. Ejecutar manualmente en el contenedor:"
echo ""
echo "   docker exec -u root n8n-container apk add --no-cache openjdk17-jre wget"
echo "   docker exec n8n-container mkdir -p /usr/local/lib/pdfbox"
echo "   docker exec n8n-container wget -O /usr/local/lib/pdfbox/pdfbox.jar \\"
echo "     https://repo1.maven.org/maven2/org/apache/pdfbox/pdfbox-app/3.0.3/pdfbox-app-3.0.3.jar"
echo ""
echo "3. Copiar pdfbox-wrapper.mjs al contenedor:"
echo "   docker cp pdfbox-wrapper.mjs n8n-container:/usr/local/lib/pdfbox/"
echo ""
echo "📚 Documentación completa:"
echo "   https://github.com/pablopescador/n8n-nodes-pdfbox"
echo ""
echo "================================================"
