# n8n-nodes-pdfbox

This is an n8n community node that provides an alternative to the built-in "Extract from PDF" node. It uses the `unpdf` library (based on PDF.js) to extract text from PDF files.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

The PDF Box node supports the following operations:

- **Extract Text**: Extract plain text from PDF files
- **Extract Markdown**: Extract text and format as Markdown (includes page count)

## Usage

1. Add the PDF Box node to your workflow
2. Connect it to a node that provides binary data (e.g., HTTP Request, Read Binary File)
3. Configure the input binary field name (default is "data")
4. Select your desired output format (Text or Markdown)
5. Execute the workflow

## Compatibility

This node has been developed and tested with n8n version 1.0.0+

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
* [unpdf library](https://github.com/unjs/unpdf)

## License

[MIT](https://github.com/pablopescador/n8n-nodes-pdfbox/blob/master/LICENSE.md)
 
