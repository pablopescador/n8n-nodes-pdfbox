#!/usr/bin/env bash

##
## Post-install script - Instalación de Apache PDFBox wrapper
## Se ejecuta automáticamente después de npm install
##

set -euo pipefail

echo "================================================"
echo "  n8n-nodes-pdfbox - Post-install"
echo "================================================"
echo ""

# Detectar si estamos dentro del contenedor n8n
if [ -d "/usr/local/lib/pdfbox" ]; then
    echo "✓ Detectado entorno n8n, copiando wrapper..."
    
    # Obtener ruta del paquete npm
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    WRAPPER_SOURCE="${SCRIPT_DIR}/pdfbox-wrapper.mjs"
    WRAPPER_DEST="/usr/local/lib/pdfbox/pdfbox-wrapper.mjs"
    
    if [ -f "$WRAPPER_SOURCE" ]; then
        cp "$WRAPPER_SOURCE" "$WRAPPER_DEST"
        chmod +x "$WRAPPER_DEST"
        echo "✓ Wrapper instalado en $WRAPPER_DEST"
    else
        echo "⚠️  Wrapper no encontrado en $WRAPPER_SOURCE"
    fi
    
    if [ -f "/usr/local/lib/pdfbox/pdfbox.jar" ]; then
        echo "✓ PDFBox JAR encontrado"
    else
        echo "⚠️  PDFBox JAR no encontrado. Ejecuta:"
        echo "   wget -O /usr/local/lib/pdfbox/pdfbox.jar \\"
        echo "     https://repo1.maven.org/maven2/org/apache/pdfbox/pdfbox-app/3.0.3/pdfbox-app-3.0.3.jar"
    fi
    
    if command -v java &> /dev/null; then
        JAVA_VERSION=$(java -version 2>&1 | head -n 1)
        echo "✓ Java instalado: $JAVA_VERSION"
    else
        echo "⚠️  Java no encontrado. Instala con: apk add openjdk17-jre"
    fi
else
    echo "⚠️  Instalación fuera del contenedor n8n"
    echo ""
    echo "REQUISITOS para usar este nodo:"
    echo ""
    echo "1. Java 17+ en el contenedor:"
    echo "   docker exec -u root n8n-container apk add --no-cache openjdk17-jre wget"
    echo ""
    echo "2. PDFBox JAR:"
    echo "   docker exec n8n-container mkdir -p /usr/local/lib/pdfbox"
    echo "   docker exec n8n-container wget -O /usr/local/lib/pdfbox/pdfbox.jar \\"
    echo "     https://repo1.maven.org/maven2/org/apache/pdfbox/pdfbox-app/3.0.3/pdfbox-app-3.0.3.jar"
    echo ""
    echo "3. Reiniciar n8n tras instalar el nodo comunitario"
fi

echo ""
echo "📚 Documentación: https://github.com/pablopescador/n8n-nodes-pdfbox"
echo "================================================"
