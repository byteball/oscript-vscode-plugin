const path = require('path')
const {
	LanguageClient,
	TransportKind
} = require('vscode-languageclient')
const vscode = require('vscode')
const ojson = require('./languages/ojson')

let client

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

	// Start the client. This will also launch the server
	client.start()
}
exports.activate = activate

function deactivate () {
	if (!client) {
		return undefined
	}
	return client.stop()
}

module.exports = {
	activate,
	deactivate
}
