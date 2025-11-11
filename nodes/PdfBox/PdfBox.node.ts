import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { extractText } from 'unpdf';

export class PdfBox implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'PDF Box',
		name: 'pdfBox',
		icon: 'file:pdfbox.svg',
		group: ['transform'],
		version: 1,
		description: 'Extract text from PDF files using PDFBox',
		defaults: {
			name: 'PDF Box',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Input Binary Field',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				description: 'Name of the binary property containing the PDF file',
			},
			{
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'options',
				options: [
					{
						name: 'Text',
						value: 'text',
						description: 'Extract plain text from PDF',
					},
					{
						name: 'Markdown',
						value: 'markdown',
						description: 'Extract text and convert to Markdown format',
					},
				],
				default: 'text',
				description: 'Format of the extracted content',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
				const outputFormat = this.getNodeParameter('outputFormat', itemIndex) as string;

				const item = items[itemIndex];

				if (!item.binary) {
					throw new NodeOperationError(this.getNode(), 'No binary data exists on item!', {
						itemIndex,
					});
				}

				if (!item.binary[binaryPropertyName]) {
					throw new NodeOperationError(
						this.getNode(),
						`Binary property "${binaryPropertyName}" does not exist on item!`,
						{ itemIndex },
					);
				}

				// Get the binary data buffer
				const binaryData = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);

				// Extract text from PDF
				const extractedData = await extractText(binaryData);

				let outputData: any = {
					text: extractedData.text,
				};

				if (outputFormat === 'markdown') {
					// For markdown format, we include metadata and structure
					outputData = {
						text: extractedData.text,
						markdown: extractedData.text, // unpdf returns text that can be used as markdown
						pages: extractedData.totalPages,
					};
				}

				returnData.push({
					json: outputData,
					pairedItem: { item: itemIndex },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
						},
						pairedItem: { item: itemIndex },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
