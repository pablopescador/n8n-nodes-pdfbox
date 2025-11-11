# n8n-nodes-pdfbox

Nodo comunitario de n8n para extracción de **texto e imágenes** desde archivos PDF usando **Apache PDFBox**.

[![npm version](https://badge.fury.io/js/n8n-nodes-pdfbox.svg)](https://www.npmjs.com/package/n8n-nodes-pdfbox)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ¿Por qué este nodo?

El nodo nativo "Extract from File" de n8n usa `pdfjs-dist` que tiene un **bug crítico**:
- ❌ Crash (SIGILL exit 132) en PDFs >= 140 KB
- ❌ Afecta ARM64 (Raspberry Pi) y x86_64
- ❌ Bug en upstream Mozilla PDF.js 5.x

Este nodo usa **Apache PDFBox** (estándar enterprise):
- ✅ Sin crashes en PDFs grandes
- ✅ Funciona en todas las arquitecturas
- ✅ Extracción robusta de texto **e imágenes**

## Operaciones

### 1. Extraer Texto
Extrae todo el texto del PDF con estadísticas opcionales (líneas, palabras, caracteres).

### 2. Extraer Imágenes
Extrae todas las imágenes del PDF como archivos binarios separados (PNG o JPEG).

## Instalación

### 1. Instalar el nodo desde GitHub

**Opción A: Desde n8n UI**
```
Settings > Community Nodes > Install
Ingresar: pablopescador/n8n-nodes-pdfbox
```

**Opción B: Manualmente en el servidor**
```bash
# Detener n8n
docker compose -f /home/pablo/n8n/docker-compose.yml stop n8n

# Instalar el nodo
docker exec n8n-n8n-1 npm install -g pablopescador/n8n-nodes-pdfbox

# Reiniciar n8n
docker compose -f /home/pablo/n8n/docker-compose.yml start n8n
```

**Opción C: Instalación local (desarrollo)**
```bash
cd ~/.n8n/nodes
git clone https://github.com/pablopescador/n8n-nodes-pdfbox.git
cd n8n-nodes-pdfbox
npm install
npm run build
```

### 2. Instalar dependencias en el contenedor

**Requisito:** Java 17+ y Apache PDFBox deben estar en el contenedor n8n.

```bash
# Instalar Java 17
docker exec -u root n8n-container apk add --no-cache openjdk17-jre wget

# Crear directorio
docker exec n8n-container mkdir -p /usr/local/lib/pdfbox

# Descargar PDFBox
docker exec n8n-container wget -O /usr/local/lib/pdfbox/pdfbox.jar \
  https://repo1.maven.org/maven2/org/apache/pdfbox/pdfbox-app/3.0.3/pdfbox-app-3.0.3.jar

# Copiar wrapper (desde el directorio del paquete npm)
docker cp node_modules/n8n-nodes-pdfbox/scripts/pdfbox-wrapper.mjs \
  n8n-container:/usr/local/lib/pdfbox/
```

## Uso

### Extracción de Texto

1. Añade el nodo **PDF Box** a tu workflow
2. Conecta un nodo que provea datos binarios (ej: HTTP Request, Webhook)
3. Configura:
   - **Operación**: Extraer Texto
   - **Archivo PDF**: `data` (o nombre de la propiedad binaria)
   - **Opciones**:
     - Incluir estadísticas: ✅
     - Max Buffer: 10 MB (ajustar para PDFs grandes)

**Output:**
```json
{
  "text": "Texto completo extraído del PDF...",
  "fileName": "documento.pdf",
  "mimeType": "application/pdf",
  "stats": {
    "lines": 1070,
    "words": 9853,
    "characters": 52525,
    "sizeKB": 51
  },
  "extractedAt": "2025-11-11T22:30:00.000Z"
}
```

### Extracción de Imágenes

1. Añade el nodo **PDF Box** a tu workflow
2. Conecta un nodo que provea datos binarios
3. Configura:
   - **Operación**: Extraer Imágenes
   - **Archivo PDF**: `data`
   - **Opciones**:
     - Formato de salida: PNG o JPEG
     - Prefijo: `image` (personalizable)

**Output:** Un item por cada imagen extraída, con datos binarios listos para guardar o procesar.

```json
{
  "json": {
    "fileName": "image-1.png",
    "sourceFile": "documento.pdf",
    "extractedAt": "2025-11-11T23:25:00.000Z"
  },
  "binary": {
    "data": {
      "data": "...",
      "mimeType": "image/png",
      "fileName": "image-1.png"
    }
  }
}
```

### Ejemplo de workflow

**Texto:**
```
[HTTP Request] → [PDF Box: Extraer Texto] → [AI Agent]
   (descarga)          (extrae texto)         (analiza)
```

**Imágenes:**
```
[Webhook] → [PDF Box: Extraer Imágenes] → [Google Drive]
 (recibe)        (extrae imágenes)          (guarda)
```

## Output

Ver sección "Uso" arriba para ejemplos de output de cada operación.

## Desarrollo

```bash
# Clonar repositorio
git clone https://github.com/pablopescador/n8n-nodes-pdfbox.git
cd n8n-nodes-pdfbox

# Instalar dependencias
npm install

# Compilar
npm run build

# Lint
npm run lint
```

## Licencia

MIT © Pablo Pescador

## Soporte

- **Issues**: https://github.com/pablopescador/n8n-nodes-pdfbox/issues
- **Documentación**: Ver carpeta `docs/`

## Agradecimientos

- Apache PDFBox: https://pdfbox.apache.org/
- n8n: https://n8n.io/
