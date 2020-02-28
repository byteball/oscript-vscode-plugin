const {
	Range,
	createConnection,
	TextDocuments,
	DiagnosticSeverity,
	ProposedFeatures
} = require('vscode-languageserver')

const ValidationUtils = require('ocore/validation_utils')
const aaValidation = require('ocore/aa_validation')
const parseOjson = require('ocore/formula/parse_ojson')
const { promisify } = require('util')

const documents = new TextDocuments()
const connection = createConnection(ProposedFeatures.all)

connection.onInitialize((params) => {})

connection.onInitialized(() => {})

documents.onDidChangeContent(change => {
	validateTextDocument(change.document)
})

async function validateTextDocument (textDocument) {
	const text = textDocument.getText()
	let diagnostics = []

	try {
		const parsedOjson = await promisify(parseOjson.parse)(text)
		const template = parsedOjson[1]

		if ('messages' in template) {
			await promisify(aaValidation.validateAADefinition)(parsedOjson)
		} else {
			if (ValidationUtils.hasFieldsExcept(template, ['base_aa', 'params'])) {
				throw new Error('foreign fields in parameterized AA definition')
			}
			if (!ValidationUtils.isNonemptyObject(template.params)) {
				throw new Error('no params in parameterized AA')
			}
			if (!ValidationUtils.isValidAddress(template.base_aa)) {
				throw new Error('base_aa is not a valid address')
			}
		}
	} catch (e) {
		const error = e.message || e
		let range
		const match = error.match(/at line (\d+) col (\d+)/)
		if (match) {
			range = Range.create(
				Number(match[1]) - 1,
				Number(match[2]) - 1,
				Number(match[1]) - 1,
				Number.MAX_VALUE
			)
		} else {
			range = Range.create(
				0,
				0,
				Number.MAX_VALUE,
				Number.MAX_VALUE
			)
		}

		diagnostics.push({
			range,
			message: error,
			source: 'ocore',
			severity: DiagnosticSeverity.Error
		})
	}

	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics })
}

documents.listen(connection)
connection.listen()
