const path = require('path')
const {
	LanguageClient,
	TransportKind
} = require('vscode-languageclient')
const vscode = require('vscode')
const ojson = require('./languages/ojson')

let client, statusBarItem
const validations = {}

function activate (context) {
	vscode.languages.registerCompletionItemProvider('ojson', {
		triggerCharacters: ojson.triggerCharacters,
		provideCompletionItems: (model, position) => {
			return ojson.suggestions(model, position)
		}
	})

	vscode.languages.registerHoverProvider('ojson', {
		provideHover: (model, position) => {
			return ojson.hovers(model, position)
		}
	})

	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
	statusBarItem.command = 'oscript-vscode-plugin.deployAa'
	statusBarItem.tooltip = 'Click to deploy Autonomous Agent'

	let serverModule = context.asAbsolutePath(
		path.join('server', 'server.js')
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
		documentSelector: [{ scheme: 'file', language: 'ojson' }],
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

		const deployCommand = vscode.commands.registerCommand('oscript-vscode-plugin.deployAa', () => {
			if (vscode.window.activeTextEditor) {
				const uri = vscode.window.activeTextEditor.document.uri.toString()
				client.sendRequest('deploy-aa', { uri })
			}
		})
		context.subscriptions.push(deployCommand)

		const checkDuplicateCommand = vscode.commands.registerCommand('oscript-vscode-plugin.checkDuplicateAa', () => {
			if (vscode.window.activeTextEditor) {
				const uri = vscode.window.activeTextEditor.document.uri.toString()
				client.sendRequest('check-duplicate', { uri })
			}
		})
		context.subscriptions.push(checkDuplicateCommand)
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
