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

function inspectTextDocumentRules (textDocument, rawParsed) {
	const text = textDocument.getText()
	rawParsed = rawParsed || parseOjson.parseOjsonGrammar(text)

	const checks = inspectRules(rawParsed.results[0])
	return checks.map(c => c.toDiagnostic(textDocument))
}

async function validateTextDocument (textDocument) {
	connection.sendRequest('aa-validation-inprogress')

	const text = textDocument.getText()
	let diagnostics = []
	let parsedOjson
	let rawParsed

	try {
		parsedOjson = await promisify(parseOjson.parse)(text)
		rawParsed = parseOjson.parseOjsonGrammar(text)
		const template = parsedOjson[1]

		if ('messages' in template) {
			const aaAddress = objectHash.getChash160(parsedOjson)
			const { complexity, count_ops: countOps } = await validateAADefinitionWithDetails(parsedOjson)
			const warnings = inspectTextDocumentRules(textDocument, rawParsed)
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
		const error = e.message || e
		diagnostics.push(buildErrorDiagnostic(textDocument, error, rawParsed, e.validationDetails))
		connection.sendRequest('aa-validation-error', { error })
	}

	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics })
	return parsedOjson
}

function validateAADefinitionWithDetails (parsedOjson) {
	return new Promise((resolve, reject) => {
		aaValidation.validateAADefinition(parsedOjson, (error, result) => {
			if (!error) return resolve(result)

			const validationError = new Error(error)
			validationError.validationDetails = result
			reject(validationError)
		})
	})
}

function buildErrorDiagnostic (textDocument, error, rawParsed, validationDetails) {
	const formulaMatch = error.match(/^validation of formula ([\s\S]+) failed: ([\s\S]+)/)
	let message
	let range

	if (formulaMatch) {
		message = formulaMatch[2]
		range = rangeForFormula(textDocument, formulaMatch[1], message, rawParsed, validationDetails)
	} else if (error.match(/at line (\d+) col (\d+)/)) {
		const match = error.match(/at line (\d+) col (\d+)/)
		message = error
		range = Range.create(
			Number(match[1]) - 1,
			Number(match[2]) - 1,
			Number(match[1]) - 1,
			Number.MAX_VALUE
		)
	} else {
		message = error
		range = Range.create(
			0,
			0,
			Number.MAX_VALUE,
			Number.MAX_VALUE
		)
	}

	return {
		range,
		message: normalizeMessage(message).replace(/\t/g, ' '),
		source: 'ocore',
		severity: DiagnosticSeverity.Error
	}
}

function rangeForFormula (textDocument, formula, message, rawParsed, validationDetails) {
	const locations = collectFormulaLocations(rawParsed)
		.filter(location => location.value === formula)
	const location = selectFormulaLocation(locations, message)

	if (location) {
		const errorLocation = validationDetails && validationDetails.formula === formula
			? validationDetails.error_location
			: null
		if (errorLocation && Number.isInteger(errorLocation.offset)) {
			const start = location.context.offset + errorLocation.offset
			const length = Number.isInteger(errorLocation.length) ? errorLocation.length : 1
			return Range.create(
				textDocument.positionAt(start),
				textDocument.positionAt(start + length)
			)
		}

		const variable = getUninitializedVariable(message)
		if (variable) {
			const varPosition = formula.search(new RegExp('\\$' + variable + '\\b'))
			if (varPosition !== -1) {
				return Range.create(
					textDocument.positionAt(location.context.offset + varPosition),
					textDocument.positionAt(location.context.offset + varPosition + variable.length + 1)
				)
			}
		}

		return Range.create(
			textDocument.positionAt(location.context.offset),
			textDocument.positionAt(location.context.offset + formula.length)
		)
	}

	const start = textDocument.getText().indexOf(formula)
	if (start !== -1) {
		const variable = getUninitializedVariable(message)
		if (variable) {
			const varPosition = formula.search(new RegExp('\\$' + variable + '\\b'))
			if (varPosition !== -1) {
				return Range.create(
					textDocument.positionAt(start + varPosition),
					textDocument.positionAt(start + varPosition + variable.length + 1)
				)
			}
		}

		return Range.create(
			textDocument.positionAt(start),
			textDocument.positionAt(start + formula.length)
		)
	}

	return Range.create(0, 0, Number.MAX_VALUE, Number.MAX_VALUE)
}

function getUninitializedVariable (message) {
	const match = message.match(/uninitialized local var (\w+)$/)
	return match && match[1]
}

function selectFormulaLocation (locations, message) {
	if (locations.length === 0) return null

	if (message.indexOf('state var assignment not allowed here') !== -1) {
		return locations.find(location => location.key === 'init') ||
			locations.find(location => location.key !== 'state') ||
			locations[0]
	}

	return locations[0]
}

function collectFormulaLocations (rawParsed) {
	const root = rawParsed && Array.isArray(rawParsed.results)
		? rawParsed.results[0]
		: rawParsed
	const locations = []

	function visit (node, key) {
		if (!node || typeof node !== 'object') return

		if (node.type === parseOjson.TYPES.FORMULA) {
			locations.push({ value: node.value, context: node.context, key })
			return
		}

		if (node.type === parseOjson.TYPES.PAIR) {
			visit(node.key, key)
			visit(node.value, node.key && node.key.value)
			return
		}

		if (Array.isArray(node.value)) {
			node.value.forEach(child => visit(child, key))
		}
	}

	visit(root)
	return locations
}

function normalizeMessage (message) {
	const invalidMatch = message.match(/^(?:statement|expr) [\s\S]+ invalid: ([\s\S]+)$/)
	if (invalidMatch) {
		message = invalidMatch[1]
	}

	if (message === 'state var assignment not allowed here') {
		return 'State variable assignment is not allowed here'
	}

	const unexpectedMatch = message.match(/^(.*?at line \d+ col \d+):[\s\S]*?(Unexpected [^\n]+)/)
	if (unexpectedMatch) {
		return `${unexpectedMatch[1]}: ${unexpectedMatch[2]}`
	}

	if (message.match(/^uninitialized local var \w+$/)) {
		return message.replace(/^uninitialized local var (\w+)$/, 'Uninitialized local variable $$$1')
	}

	return message
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
