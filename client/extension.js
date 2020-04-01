const path = require('path')
const {
	LanguageClient,
	TransportKind
} = require('vscode-languageclient')
const vscode = require('vscode')
const oscript = require('./languages')
const config = require('../config/default.json')
const testing = require('./testing')
// eslint-disable-next-line no-unused-vars
const toRegex = require('to-regex')

let client, statusBarItem
const validations = {}

function activate (context) {
	vscode.languages.registerCompletionItemProvider('oscript', {
		triggerCharacters: oscript.triggerCharacters,
		provideCompletionItems: (model, position) => {
			return oscript.suggestions(model, position)
		}
	})

	vscode.languages.registerHoverProvider('oscript', {
		provideHover: (model, position) => {
			return oscript.hovers(model, position)
		}
	})

	vscode.languages.registerCodeLensProvider('javascript', {
		provideCodeLenses: (document) => {
			return testing.provideCodeLens()
		}
	})

	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
	statusBarItem.command = 'oscript.deployAa'
	statusBarItem.tooltip = 'Click to deploy Autonomous Agent'

	let serverModule = context.asAbsolutePath(
		path.join('server', 'server.js')
		// path.join('server', 'out', 'server.js')
	)

	let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] }

	let serverOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions
		}
	}

	let clientOptions = {
		documentSelector: [{ scheme: 'file', language: 'oscript' }],
		synchronize: {
			fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
		}
	}

	client = new LanguageClient(
		'oscriptLanguageServer',
		'Oscript Language Server',
		serverOptions,
		clientOptions
	)

	client.start()
	client.onReady().then(() => {
		client.onRequest('aa-validation-success', aaValidationSuccess)
		client.onRequest('aa-validation-error', aaValidationError)
		client.onRequest('aa-validation-inprogress', aaValidationInProgress)

		const deployCommand = vscode.commands.registerCommand('oscript.deployAa', async () => {
			const network = await vscode.window.showInformationMessage('Choose a network for deployment', 'testnet', 'mainnet' /* 'local' */)
			if (network) {
				if (vscode.window.activeTextEditor) {
					const uri = vscode.window.activeTextEditor.document.uri.toString()
					client.sendRequest('deploy-aa', { uri, config: config.deployment[network] })
				}
			}
		})
		context.subscriptions.push(deployCommand)

		const checkDuplicateCommand = vscode.commands.registerCommand('oscript.checkDuplicateAa', async () => {
			const network = await vscode.window.showInformationMessage('Choose a network for duplication check', 'testnet', 'mainnet' /* 'local' */)
			if (network) {
				if (vscode.window.activeTextEditor) {
					const uri = vscode.window.activeTextEditor.document.uri.toString()
					client.sendRequest('check-duplicate', { uri, config: config.deployment[network] })
				}
			}
		})
		context.subscriptions.push(checkDuplicateCommand)

		const testCurrentFileCommand = vscode.commands.registerCommand('oscript.test.currentFile', testing.testCurrentFile)
		context.subscriptions.push(testCurrentFileCommand)

		const testExampleFilesCommand = vscode.commands.registerCommand('oscript.test.example', testing.provideTestExample)
		context.subscriptions.push(testExampleFilesCommand)
	})

	vscode.window.onDidChangeActiveTextEditor((editor) => {
		if (editor) {
			const uri = editor.document.uri.toString()
			if (validations[uri]) {
				statusBarItem.text = validations[uri]
				statusBarItem.show()
			} else {
				statusBarItem.hide()
			}
		}
	})
}

function aaValidationSuccess ({ complexity, countOps }) {
	const text = `$(info) AA validated, complexity = ${complexity}, ops = ${countOps}`
	updateValidations(text)
	statusBarItem.text = text
	statusBarItem.show()
}

// eslint-disable-next-line handle-callback-err
function aaValidationError ({ error }) {
	updateValidations()
	statusBarItem.hide()
}

function aaValidationInProgress () {
	updateValidations()
	statusBarItem.hide()
}

function updateValidations (value) {
	if (vscode.window.activeTextEditor) {
		const uri = vscode.window.activeTextEditor.document.uri.toString()
		validations[uri] = value
	}
}

function deactivate () {
	if (!client) {
		return undefined
	}
	return client.stop()
}

exports.activate = activate
module.exports = {
	activate,
	deactivate
}
