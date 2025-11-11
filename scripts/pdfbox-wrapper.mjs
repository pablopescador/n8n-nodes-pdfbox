#!/usr/bin/env node

/**
 * PDFBox Wrapper para n8n-nodes-pdfbox
 * Extrae texto e imágenes de PDFs usando Apache PDFBox (Java)
 * 
 * Solución enterprise-grade que evita bug de pdfjs-dist 5.x (SIGILL)
 * Requiere: Java 17+ instalado en contenedor
 */

import { spawn } from 'child_process';
import { readFile, unlink, mkdir } from 'fs/promises';
import { randomBytes } from 'crypto';
import { existsSync } from 'fs';

/**
 * Extrae texto de un PDF usando Apache PDFBox
 * @param {string} pdfPath - Ruta absoluta al archivo PDF
 * @param {string} jarPath - Ruta al JAR de PDFBox (default: /usr/local/lib/pdfbox/pdfbox.jar)
 * @returns {Promise<string>} - Texto extraído del PDF
 */
async function extractTextPDFBox(pdfPath, jarPath = '/usr/local/lib/pdfbox/pdfbox.jar') {
    // Usar archivo temporal para evitar warning de encoding en -console
    const tempFile = `/tmp/pdfbox_${randomBytes(8).toString('hex')}.txt`;
    
    return new Promise((resolve, reject) => {
        // Comando: java -jar pdfbox.jar export:text -i input.pdf -o output.txt
        const args = [
            '-jar', jarPath,
            'export:text',
            '-i', pdfPath,
            '-o', tempFile,
            '-encoding', 'UTF-8'  // Encoding explícito
        ];

        console.error(`[PDFBox] Ejecutando: java ${args.join(' ')}`);
        
        const java = spawn('java', args);
        let stderr = '';

        java.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        java.on('close', async (code) => {
            if (code !== 0) {
                console.error(`[PDFBox] Error stderr: ${stderr}`);
                reject(new Error(`PDFBox falló con código ${code}: ${stderr}`));
            } else {
                try {
                    // Leer archivo temporal
                    const text = await readFile(tempFile, 'utf-8');
                    
                    // Limpiar archivo temporal
                    await unlink(tempFile).catch(() => {
                        // Ignorar errores de limpieza
                    });
                    
                    console.error(`[PDFBox] Extracción exitosa (${text.length} bytes)`);
                    resolve(text);
                } catch (err) {
                    reject(new Error(`Error leyendo archivo temporal: ${err.message}`));
                }
            }
        });

        java.on('error', (err) => {
            reject(new Error(`Error al ejecutar Java: ${err.message}`));
        });
    });
}

/**
 * Extrae imágenes de un PDF usando Apache PDFBox
 * @param {string} pdfPath - Ruta absoluta al archivo PDF
 * @param {string} outputDir - Directorio donde guardar las imágenes
 * @param {string} prefix - Prefijo para nombres de archivos (default: 'image')
 * @param {string} format - Formato de imagen: 'png' o 'jpg' (default: 'png')
 * @param {string} jarPath - Ruta al JAR de PDFBox
 * @returns {Promise<number>} - Número de imágenes extraídas
 */
async function extractImagesPDFBox(pdfPath, outputDir, prefix = 'image', format = 'png', jarPath = '/usr/local/lib/pdfbox/pdfbox.jar') {
    // Crear directorio de salida si no existe
    if (!existsSync(outputDir)) {
        await mkdir(outputDir, { recursive: true });
    }
    
    return new Promise((resolve, reject) => {
        // Comando: java -jar pdfbox.jar export:images -i input.pdf -o outputDir/ -prefix image
        const args = [
            '-jar', jarPath,
            'export:images',
            '-i', pdfPath,
            '-o', outputDir,
            '-prefix', prefix,
            '-format', format
        ];

        console.error(`[PDFBox] Extrayendo imágenes: java ${args.join(' ')}`);
        
        const java = spawn('java', args);
        let stderr = '';
        let stdout = '';

        java.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        java.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        java.on('close', (code) => {
            if (code !== 0) {
                console.error(`[PDFBox] Error stderr: ${stderr}`);
                reject(new Error(`PDFBox falló con código ${code}: ${stderr}`));
            } else {
                // Contar archivos en directorio
                const fs = require('fs');
                const files = fs.readdirSync(outputDir);
                const imageFiles = files.filter(f => f.endsWith(`.${format}`));
                
                console.error(`[PDFBox] Extracción exitosa: ${imageFiles.length} imágenes`);
                resolve(imageFiles.length);
            }
        });

        java.on('error', (err) => {
            reject(new Error(`Error al ejecutar Java: ${err.message}`));
        });
    });
}

/**
 * Main: Test del wrapper con archivo PDF
 */
async function main() {
    const operation = process.argv[2];
    
    if (operation === 'extractImages') {
        const pdfPath = process.argv[3];
        const outputDir = process.argv[4];
        const prefix = process.argv[5] || 'image';
        const format = process.argv[6] || 'png';
        
        if (!pdfPath || !outputDir) {
            console.error('Uso: node pdfbox-wrapper.mjs extractImages <ruta-pdf> <directorio-salida> [prefijo] [formato]');
            console.error('Ejemplo: node pdfbox-wrapper.mjs extractImages /tmp/test.pdf /tmp/images image png');
            process.exit(1);
        }

        try {
            console.error(`\n=== PDFBox Image Extraction ===`);
            console.error(`Archivo: ${pdfPath}`);
            console.error(`Directorio: ${outputDir}`);
            console.error(`Prefijo: ${prefix}`);
            console.error(`Formato: ${format}`);
            console.error(`Timestamp: ${new Date().toISOString()}\n`);

            const count = await extractImagesPDFBox(pdfPath, outputDir, prefix, format);
            
            console.error(`\n✅ Extraídas ${count} imágenes`);
            process.exit(0);
        } catch (error) {
            console.error(`\n❌ Error: ${error.message}`);
            process.exit(1);
        }
    } else {
        // Extracción de texto (comportamiento por defecto)
        const pdfPath = operation || process.argv[2];
        
        if (!pdfPath) {
            console.error('Uso: node pdfbox-wrapper.mjs <ruta-pdf>');
            console.error('   o: node pdfbox-wrapper.mjs extractImages <ruta-pdf> <directorio-salida> [prefijo] [formato]');
            process.exit(1);
        }

        try {
            console.error(`\n=== PDFBox Text Extraction ===`);
            console.error(`Archivo: ${pdfPath}`);
            console.error(`Timestamp: ${new Date().toISOString()}\n`);

            // Extraer texto
            const text = await extractTextPDFBox(pdfPath);

            // Estadísticas
            const lines = text.split('\n').length;
            const words = text.split(/\s+/).filter(w => w.length > 0).length;
            const chars = text.length;

            console.error(`\n=== Estadísticas ===`);
            console.error(`Líneas: ${lines}`);
            console.error(`Palabras: ${words}`);
            console.error(`Caracteres: ${chars}`);
            console.error(`\n=== Primeros 500 caracteres ===`);
            console.error(text.substring(0, 500));
            console.error('\n=== Texto completo (stdout) ===\n');

            // Output completo a stdout (para n8n)
            console.log(text);
            
            process.exit(0);
        } catch (error) {
            console.error(`\n❌ Error: ${error.message}`);
            process.exit(1);
        }
    }
}

// Ejecutar si se llama directamente
if (process.argv[1].endsWith('pdfbox-wrapper.mjs')) {
    main();
}

// Exportar para uso como módulo
export { extractTextPDFBox, extractImagesPDFBox };
