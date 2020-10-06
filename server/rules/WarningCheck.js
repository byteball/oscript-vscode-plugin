const { DiagnosticSeverity } = require('vscode-languageserver')
const AbstractCheck = require('./AbstractCheck')

class WarningCheck extends AbstractCheck {
	constructor ({ startCol, endCol, message }, context) {
		super({ severity: DiagnosticSeverity.Warning, startCol, endCol, message }, context)
	}
}

module.exports = WarningCheck
