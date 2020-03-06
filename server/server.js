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

let constants, objectHash, configuration, deploymentProtocol

const duplicateChecks = {}
const documents = new TextDocuments()
const connection = createConnection(ProposedFeatures.all)

connection.onInitialize((params) => {})

connection.onInitialized(async () => {
	configuration = await connection.workspace.getConfiguration('oscript')

	constants = require('ocore/constants')
	constants.bTestnet = configuration.testnet
	deploymentProtocol = constants.bTestnet ? 'obyte-tn' : 'obyte'
	objectHash = require('ocore/object_hash')

	connection.onRequest('deploy-aa', handleDeployAa)
})

documents.onDidChangeContent(change => {
	validateTextDocument(change.document)
})
documents.onDidOpen(change => {
	validateTextDocument(change.document)
})

async function validateTextDocument (textDocument) {
	connection.sendRequest('aa-validation-inprogress')

	const text = textDocument.getText()
	let diagnostics = []
	let parsedOjson

	try {
		parsedOjson = await promisify(parseOjson.parse)(text)
		const template = parsedOjson[1]

		if ('messages' in template) {
			const { complexity, count_ops: countOps } = await promisify(aaValidation.validateAADefinition)(parsedOjson)
			connection.sendRequest('aa-validation-success', { complexity, countOps })
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
		connection.sendRequest('aa-validation-error', { error })
	}

	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics })
	return parsedOjson
}

function checkDuplicateAgent (ojson) {
	return new Promise((resolve, reject) => {
		const address = objectHash.getChash160(ojson)
		if (address in duplicateChecks) {
			if (duplicateChecks[address].error) {
				reject(new Error(duplicateChecks[address].error))
			} else {
				resolve()
			}
			return
		}

		constants.bTestnet = true
		const client = new obyte.Client(
			configuration.hub,
			{ testnet: constants.bTestnet }
		)

		client.client.ws.addEventListener('error', (e) => {
			reject(new Error(`Unable to connect to ${configuration.hub}`))
		})

		client.client.ws.addEventListener('open', (e) => {
			client.api.getDefinition(address, function (err, result) {
				client.close()
				if (err) {
					reject(new Error(`Unable to get definition for ${address}`))
				} else if (result) {
					const msg = `Agent already deployed with address ${address}`
					duplicateChecks[address] = {
						isDuplicate: true,
						error: msg
					}
					reject(new Error(msg))
				} else {
					duplicateChecks[address] = {
						isDuplicate: false
					}
					resolve()
				}
			})
		})
	})
}

async function handleDeployAa ({ uri }) {
	const document = documents.get(uri)

	try {
		const parsedOjson = await validateTextDocument(document)
		if (!parsedOjson) {
			throw new Error('Invalid oscript')
		}

		await checkDuplicateAgent(parsedOjson)

		const { data } = await axios.post(`${configuration.deploymentBackend}/link`, document.getText(), {
			headers: {
				'Content-Type': 'text/plain'
			},
			responseType: 'json'
		})

		if (!data.shortcode) {
			throw new Error('Can not generate agent deployment link')
		}

		connection.sendRequest('show-deployment-view', {
			error: null,
			deploymentUri: `${deploymentProtocol}:data?app=definition&definition=${configuration.deploymentBackend}/link/${data.shortcode}`
		})
	} catch (e) {
		connection.sendRequest('show-deployment-view', {
			error: e.message,
			deploymentUri: null
		})
	}
}

documents.listen(connection)
connection.listen()
