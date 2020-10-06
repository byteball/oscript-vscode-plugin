const {	Range, Position } = require('vscode-languageserver')

class AbstractCheck {
	constructor ({ severity, startCol, endCol, message }, context = {}) {
		this.severity = severity
		this.startCol = startCol
		this.endCol = endCol
		this.message = message
	}

	unwrapCheck (context, value) {
		this.context = context
		this.value = value
		return this
	}

	toDiagnostic (textDocument) {
		const pos = Position.create(this.context.line - 1, this.context.col - 1)
		const offset = textDocument.offsetAt(pos)

		return {
			severity: this.severity,
			message: this.message,
			source: 'oscript-vscode-plugin',
			range: Range.create(
				textDocument.positionAt(offset + this.startCol),
				textDocument.positionAt(offset + this.endCol)
			)
		}
	}
}

module.exports = AbstractCheck
