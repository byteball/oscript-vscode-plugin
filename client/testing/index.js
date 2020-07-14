const cp = require('child_process')
const path = require('path')
const vscode = require('vscode')

const outputChannel = vscode.window.createOutputChannel('Oscript Tests')

function testCurrentFile () {
	if (vscode.window.activeTextEditor) {
		const uri = vscode.window.activeTextEditor.document.uri
		const workspaceDir = vscode.workspace.getWorkspaceFolder(uri).uri.fsPath

		if (!uri.fsPath.endsWith('.test.oscript.js')) {
			vscode.window.showErrorMessage('No test file found. Oscript test files should end with \'.test.oscript.js\'')
			return
		}

		const mochaRuntimePath = require.resolve('mocha/lib/cli/cli.js')
		const mochaArgs = [
			'--exit',
			'--bail',
			'--slow',
			'20000',
			`--require`,
			`${path.join(__dirname, 'mochaBootload.js')}`,
			uri.fsPath
		]

		outputChannel.clear()
		outputChannel.show(true)
		outputChannel.append(`Testing file ${uri.fsPath}`)
		const tp = cp.spawn(
			mochaRuntimePath,
			mochaArgs,
			{
				cwd: path.dirname(uri.fsPath),
				env: {
					...process.env,
					'VSCODE_WORKSPACE_DIR': workspaceDir
				}
			}
		)

		tp.on('error', (e) => vscode.window.showErrorMessage(e))
		tp.stdout.on('data', (chunk) => outputChannel.append(chunk.toString()))
		tp.stderr.on('data', (chunk) => outputChannel.append(chunk.toString()))
	} else {
		vscode.window.showErrorMessage('No active editor')
	}
}

function provideCodeLens () {
	if (vscode.window.activeTextEditor) {
		const uri = vscode.window.activeTextEditor.document.uri

		return uri && uri.fsPath.endsWith('.test.oscript.js')
			? [
				new vscode.CodeLens(
					new vscode.Range(1, 0, 0, 0),
					{
						title: 'run AA test',
						command: 'oscript.test.currentFile'
					}
				)
			]
			: []
	}
	return []
}

function provideTestExample () {
	const folders = vscode.workspace.workspaceFolders
	const workspaceDir = folders && folders[0] && folders[0].uri.fsPath

	if (workspaceDir) {
		Promise.all(
			[
				vscode.workspace.fs.copy(
					vscode.Uri.file(path.join(__dirname, './examples/example.aa')),
					vscode.Uri.file(path.join(workspaceDir, 'test/example.aa')),
					{ overwrite: true }
				),
				vscode.workspace.fs.copy(
					vscode.Uri.file(path.join(__dirname, './examples/example.test.oscript.js')),
					vscode.Uri.file(path.join(workspaceDir, 'test/example.test.oscript.js')),
					{ overwrite: true }
				)
			]
		).then(() => {
			vscode.window.showInformationMessage('Check `test/example.aa` and `test/example.test.oscript.js` files')
		})
	} else {
		vscode.window.showErrorMessage('No active workspace')
	}
}

exports.provideTestExample = provideTestExample
exports.provideCodeLens = provideCodeLens
exports.testCurrentFile = testCurrentFile
