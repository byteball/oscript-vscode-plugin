const vscode = require('vscode')
const cloneDeep = require('lodash/cloneDeep')
const uniq = require('lodash/uniq')
const get = require('lodash/get')
const ojsonKeysList = require('./words/ojson/keys')
const ojsonValuesList = require('./words/ojson/values')
const oscriptWordsList = require('./words/oscript/words')

module.exports = {
	triggerCharacters: '$',
	suggestions: (model, position) => {
		const lineUntilPosition = model.getText(new vscode.Range(position.line, 1, position.line, position.character))

		const makeCompletion = (w) => {
			const completion = new vscode.CompletionItem(w.label, w.kind)

			const insert = w.insertText || w.label
			completion.insertText = w.quoted ? quotedAutocomplete(lineUntilPosition, insert) : insert
			completion.documentation = get(w, 'documentation.value')
			completion.detail = w.detail

			return completion
		}

		if (isOscript(model, position)) {
			if (lineUntilPosition.search(/\$[a-zA-Z0-9_]*$/) !== -1) {
				return oscriptVariables(model)
			} else {
				return cloneDeep(oscriptWordsList).map(makeCompletion)
			}
		}

		if (isOjsonValues(model, position)) {
			return cloneDeep(ojsonValuesList).map(makeCompletion)
		} else {
			return cloneDeep(ojsonKeysList).map(makeCompletion)
		}
	},
	hovers: (model, position) => {
		const range = model.getWordRangeAtPosition(position, /(\|\||\w+)/)
		if (!range) return
		const line = model.lineAt(range.start.line).text
		const word = model.getText(range)

		let hints
		if (isOscript(model, position)) {
			let label = word
			const nextChar = line[range.end.character]
			const prevChar = line[range.start.character - 1]
			if ((label === 'asset' && nextChar === '[') || nextChar === '=' || nextChar === '!' || nextChar === '<' || nextChar === '>') {
				label += nextChar
			} else {
				if (prevChar === '.') {
					const prevRange = model.getWordRangeAtPosition(new vscode.Position(range.start.line, range.start.character - 2))
					const prev = model.getText(prevRange)
					label = `${prev}.${word}`
				} else if (nextChar === '.') {
					const nextRange = model.getWordRangeAtPosition(new vscode.Position(range.end.line, range.end.character + 1))
					const next = model.getText(nextRange)
					label = `${word}.${next}`
				} else {
					label = word
				}
			}

			hints = oscriptWordsList.filter(w => (w.label === label || (Array.isArray(w.labelAlts) && w.labelAlts.indexOf(label) !== -1)) && w.documentation)
		} else if (isOjsonValues(model, position)) {
			hints = ojsonValuesList.filter(w => w.label === word && w.documentation)
		} else {
			hints = ojsonKeysList.filter(w => w.label === word && w.documentation)
		}

		return hints.length > 0
			? {
				range: new vscode.Range(position.line, range.start.character, position.line, range.end.character),
				contents: hints.map(h => h.documentation)
			}
			: null
	}
}

const isOjsonValues = (model, position) => {
	const lineUntilPosition = model.getText(new vscode.Range(position.line, 1, position.line, position.character))

	return lineUntilPosition.match(/:\s*(\S+)?$/)
}

const isOscript = (model, position) => {
	const text = model.getText(new vscode.Range(1, 1, position.line, position.character))

	for (let i = text.length - 1; i > 0; i--) {
		const pair = text[i - 1] + text[i]
		if (pair === '"{' || pair === '`{' || pair === "'{") {
			return true
		} else if (pair === '}"' || pair === '}`' || pair === "}'") {
			return false
		}
	}
}

const oscriptVariables = (model, position) => {
	const text = model.getText()
	return uniq(text.match(/\$[a-zA-Z0-9_]+/g)).map(e => {
		const completion = new vscode.CompletionItem(e.slice(1), vscode.CompletionItemKind.Variable)
		completion.insertText = e.slice(1)
		return completion
	})
}

const quotedAutocomplete = (textUntilPosition, label) => {
	let insertText
	if (textUntilPosition.match(/'\S+$/)) {
		insertText = label
	} else if (textUntilPosition.match(/"\S+$/)) {
		insertText = label
	} else if (textUntilPosition.match(/`\S+$/)) {
		insertText = label
	} else {
		insertText = "'" + label + "'"
	}

	return insertText
}
