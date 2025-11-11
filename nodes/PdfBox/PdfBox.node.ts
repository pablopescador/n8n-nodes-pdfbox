import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { writeFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import { randomBytes } from 'crypto';

export class PdfBox implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'PDF Box',
		name: 'pdfBox',
		icon: 'file:pdfbox.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Extrae texto e imágenes de archivos PDF usando Apache PDFBox',
		defaults: {
			name: 'PDF Box',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Operación',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Extraer Texto',
						value: 'extractText',
						description: 'Extrae texto de un archivo PDF',
						action: 'Extraer texto de PDF',
					},
					{
						name: 'Extraer Imágenes',
						value: 'extractImages',
						description: 'Extrae todas las imágenes de un archivo PDF',
						action: 'Extraer imágenes de PDF',
					},
				],
				default: 'extractText',
			},
			{
				displayName: 'Archivo PDF',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						operation: ['extractText', 'extractImages'],
					},
				},
				description: 'Nombre de la propiedad binaria que contiene el PDF',
			},
			{
				displayName: 'Opciones',
				name: 'options',
				type: 'collection',
				placeholder: 'Añadir opción',
				default: {},
				displayOptions: {
					show: {
						operation: ['extractText'],
					},
				},
				options: [
					{
						displayName: 'Incluir Estadísticas',
						name: 'includeStats',
						type: 'boolean',
						default: true,
						description: 'Si se incluyen estadísticas del texto (líneas, palabras, caracteres)',
					},
					{
						displayName: 'Max Buffer (MB)',
						name: 'maxBuffer',
						type: 'number',
						default: 10,
						description: 'Tamaño máximo del buffer para PDFs grandes (en MB)',
					},
				],
			},
			{
				displayName: 'Opciones',
				name: 'options',
				type: 'collection',
				placeholder: 'Añadir opción',
				default: {},
				displayOptions: {
					show: {
						operation: ['extractImages'],
					},
				},
				options: [
					{
						displayName: 'Formato de Salida',
						name: 'imageFormat',
						type: 'options',
						options: [
							{ name: 'PNG', value: 'png' },
							{ name: 'JPEG', value: 'jpg' },
						],
						default: 'png',
						description: 'Formato de imagen para extraer',
					},
					{
						displayName: 'Prefijo',
						name: 'prefix',
						type: 'string',
						default: 'image',
						description: 'Prefijo para nombres de archivos de imagen',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		// Ruta al wrapper de PDFBox
		const WRAPPER_PATH = '/usr/local/lib/pdfbox/pdfbox-wrapper.mjs';

		for (let i = 0; i < items.length; i++) {
			try {
				if (operation === 'extractText') {
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
					const options = this.getNodeParameter('options', i, {}) as {
						includeStats?: boolean;
						maxBuffer?: number;
					};

					// Obtener datos binarios del PDF
					const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
					const pdfBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

					// Crear archivo temporal
					const tempFileName = `/tmp/pdf_${randomBytes(8).toString('hex')}.pdf`;
					writeFileSync(tempFileName, pdfBuffer);

					try {
						// Extraer texto usando PDFBox
						const maxBuffer = (options.maxBuffer || 10) * 1024 * 1024;
						const text = execSync(
							`node ${WRAPPER_PATH} ${tempFileName}`,
							{
								encoding: 'utf-8',
								maxBuffer: maxBuffer,
							}
						);

						// Calcular estadísticas si se solicitan
						let stats = {};
						if (options.includeStats !== false) {
							const lines = text.split('\n').length;
							const words = text.split(/\s+/).filter((w: string) => w.length > 0).length;
							const chars = text.length;

							stats = {
								lines,
								words,
								characters: chars,
								sizeKB: Math.round(chars / 1024),
							};
						}

						// Retornar resultado
						returnData.push({
							json: {
								text,
								fileName: binaryData.fileName || 'unknown.pdf',
								mimeType: binaryData.mimeType,
								...(options.includeStats !== false && { stats }),
								extractedAt: new Date().toISOString(),
							},
							pairedItem: { item: i },
						});

					} finally {
						// Limpiar archivo temporal
						try {
							unlinkSync(tempFileName);
						} catch (error) {
							// Ignorar errores de limpieza
						}
					}
				} else if (operation === 'extractImages') {
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
					const options = this.getNodeParameter('options', i, {}) as {
						imageFormat?: string;
						prefix?: string;
					};

					// Obtener datos binarios del PDF
					const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
					const pdfBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

					// Crear archivo temporal para el PDF
					const tempPdfFile = `/tmp/pdf_${randomBytes(8).toString('hex')}.pdf`;
					const tempDir = `/tmp/images_${randomBytes(8).toString('hex')}`;
					
					writeFileSync(tempPdfFile, pdfBuffer);

					try {
						// Extraer imágenes usando PDFBox wrapper
						const imageFormat = options.imageFormat || 'png';
						const prefix = options.prefix || 'image';
						
						execSync(
							`node ${WRAPPER_PATH} extractImages ${tempPdfFile} ${tempDir} ${prefix} ${imageFormat}`,
							{ encoding: 'utf-8' }
						);

						// Leer las imágenes extraídas
						const fs = require('fs');
						const path = require('path');
						const imageFiles = fs.readdirSync(tempDir);

						if (imageFiles.length === 0) {
							returnData.push({
								json: {
									message: 'No se encontraron imágenes en el PDF',
									fileName: binaryData.fileName || 'unknown.pdf',
								},
								pairedItem: { item: i },
							});
						} else {
							// Crear un item por cada imagen
							for (const imageFile of imageFiles) {
								const imagePath = path.join(tempDir, imageFile);
								const imageBuffer = fs.readFileSync(imagePath);

								returnData.push({
									json: {
										fileName: imageFile,
										sourceFile: binaryData.fileName || 'unknown.pdf',
										extractedAt: new Date().toISOString(),
									},
									binary: {
										data: await this.helpers.prepareBinaryData(
											imageBuffer,
											imageFile,
											`image/${imageFormat}`
										),
									},
									pairedItem: { item: i },
								});

								// Limpiar imagen temporal
								try {
									unlinkSync(imagePath);
								} catch (error) {
									// Ignorar errores de limpieza
								}
							}
						}

					} finally {
						// Limpiar archivos temporales
						try {
							unlinkSync(tempPdfFile);
							const fs = require('fs');
							fs.rmdirSync(tempDir, { recursive: true });
						} catch (error) {
							// Ignorar errores de limpieza
						}
					}
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: errorMessage,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), `Error extrayendo PDF: ${errorMessage}`, {
					itemIndex: i,
				});
			}
		}

		return [returnData];
	}
}
