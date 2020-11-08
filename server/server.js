const {
	Range,
	createConnection,
	TextDocuments,
	DiagnosticSeverity,
	ProposedFeatures
} = require('vscode-languageserver')
const axios = require('axios')
const { promisify } = require('util')
const obyte = require('obyte')
const ValidationUtils = require('ocore/validation_utils')
const aaValidation = require('ocore/aa_validation')
const parseOjson = require('ocore/formula/parse_ojson')
const objectHash = require('ocore/object_hash')
const open = require('open')
const { inspectRules } = require('./rules')

const duplicateChecks = {
	mainnet: {},
	testnet: {}
}
const documents = new TextDocuments()
const connection = createConnection(ProposedFeatures.all)

connection.onInitialize((params) => {})

connection.onInitialized(async () => {})

documents.onDidChangeContent(change => {
	validateTextDocument(change.document)
})
documents.onDidOpen(change => {
	validateTextDocument(change.document)
})

function inspectTextDocumentRules (textDocument) {
	const text = textDocument.getText()
	const rawParsed = parseOjson.parseOjsonGrammar(text)

	const checks = inspectRules(rawParsed.results[0])
	return checks.map(c => c.toDiagnostic(textDocument))
}

async function validateTextDocument (textDocument) {
	connection.sendRequest('aa-validation-inprogress')

	const text = textDocument.getText()
	let diagnostics = []
	let parsedOjson

	try {
		parsedOjson = await promisify(parseOjson.parse)(text)
		const template = parsedOjson[1]

		if ('messages' in template) {
			const aaAddress = objectHash.getChash160(parsedOjson)
			const { complexity, count_ops: countOps } = await promisify(aaValidation.validateAADefinition)(parsedOjson)
			const warnings = inspectTextDocumentRules(textDocument)
			diagnostics = [...diagnostics, ...warnings]
			connection.sendRequest('aa-validation-success', { complexity, countOps, aaAddress })
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
		let message
		const error = e.message || e
		let range
		if (error.match(/at line (\d+) col (\d+)/)) {
			const match = error.match(/at line (\d+) col (\d+)/)
			message = error
			range = Range.create(
				Number(match[1]) - 1,
				Number(match[2]) - 1,
				Number(match[1]) - 1,
				Number.MAX_VALUE
			)
		} else if (error.match(/^validation of formula ([\s\S]+) failed: ([\s\S]+)/)) {
			const match = error.match(/^validation of formula ([\s\S]+) failed: ([\s\S]+)/)
			message = match[2]
			if (message.indexOf('uninitialized local var') !== -1) {
				const varMatch = message.match(/uninitialized local var (\w+)$/)
				const variable = varMatch[1]
				const start = text.indexOf(match[1])
				const varPosition = match[1].search(new RegExp('\\$' + variable + '\\b'))
				range = Range.create(
					textDocument.positionAt(start + varPosition),
					textDocument.positionAt(start + varPosition + variable.length + 1)
				)
			} else {
				const start = text.indexOf(match[1])
				range = Range.create(
					textDocument.positionAt(start),
					textDocument.positionAt(start + match[1].length)
				)
			}
		} else {
			message = error
			range = Range.create(
				0,
				0,
				Number.MAX_VALUE,
				Number.MAX_VALUE
			)
		}

		diagnostics.push({
			range,
			message: message.replace(/\t/g, ' '),
			source: 'ocore',
			severity: DiagnosticSeverity.Error
		})
		connection.sendRequest('aa-validation-error', { error })
	}

	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics })
	return parsedOjson
}

function checkDuplicateAgent (ojson, config) {
	return new Promise((resolve, reject) => {
		const address = objectHash.getChash160(ojson)
		const networkKey = config.testnet ? 'testnet' : 'mainnet'
		if (address in duplicateChecks[networkKey]) {
			if (duplicateChecks[networkKey][address].error) {
				reject(new Error(duplicateChecks[networkKey][address].error))
			} else {
				resolve(address)
			}
			return
		}

		const client = new obyte.Client(
			config.hub,
			{ testnet: config.testnet }
		)

		client.client.ws.addEventListener('error', (e) => {
			reject(new Error(`Unable to connect to ${config.hub}`))
		})

		client.client.ws.addEventListener('open', (e) => {
			client.api.getDefinition(address, function (err, result) {
				client.close()
				if (err) {
					reject(new Error(`Unable to get definition for ${address}`))
				} else if (result) {
					const msg = `Agent already deployed with address ${address}`
					duplicateChecks[networkKey][address] = {
						isDuplicate: true,
						error: msg
					}
					reject(new Error(msg))
				} else {
					resolve(address)
				}
			})
		})
	})
}

async function handleCheckDuplicate ({ uri, config }) {
	const document = documents.get(uri)

	try {
		const parsedOjson = await validateTextDocument(document)
		if (!parsedOjson) {
			throw new Error('Invalid oscript')
		}

		const address = await checkDuplicateAgent(parsedOjson, config)
		connection.window.showInformationMessage(`Agent is ready for deployment with address ${address}`)
	} catch (e) {
		connection.window.showErrorMessage(e.message)
	}
}

async function handleDeployAa ({ uri, config }) {
	const document = documents.get(uri)

	try {
		const parsedOjson = await validateTextDocument(document)
		if (!parsedOjson) {
			throw new Error('Invalid oscript')
		}

		await checkDuplicateAgent(parsedOjson, config)

		const { data } = await axios.post(`${config.backend}/link`, document.getText(), {
			headers: {
				'Content-Type': 'text/plain'
			},
			responseType: 'json'
		})

		if (!data.shortcode) {
			throw new Error('Can not generate agent deployment link')
		}

		const link = `${config.frontnend}/d/${data.shortcode}`
		open(link)
	} catch (e) {
		connection.window.showErrorMessage(e.message)
	}
}

async function handleGetAaAddress ({ uri }) {
	const document = documents.get(uri)

	try {
		const parsedOjson = await validateTextDocument(document)
		if (!parsedOjson) {
			throw new Error('Invalid oscript')
		}

		return objectHash.getChash160(parsedOjson)
	} catch (e) {
		connection.window.showErrorMessage(e.message)
	}
}

documents.listen(connection)
connection.listen()

connection.onRequest('deploy-aa', handleDeployAa)
connection.onRequest('get-aa-address', handleGetAaAddress)
connection.onRequest('check-duplicate', handleCheckDuplicate)
