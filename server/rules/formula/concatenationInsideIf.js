const _ = require('lodash')
const parseOjson = require('ocore/formula/parse_ojson')
const WarningCheck = require('../WarningCheck')

function concatenationInsideIf (formula) {
	const checks = []
	if (findConcatInIf(formula)) {
		const re = new RegExp('if\\s*\\(.+\\|\\|.+\\)', 'g')
		let match
		while ((match = re.exec(formula)) != null) {
			checks.push(
				new WarningCheck({
					startCol: match.index,
					endCol: match.index + match[0].length,
					message: 'Possible mistake: `||` is the concatenation operator. Use `OR` for the logical operator.'
				})
			)
		}
	}
	return checks
}

function findConcatInIf (formula) {
	let found = false
	function recursiveFind (st) {
		if (found) return
		if (st[0] === 'ifelse') {
			st.forEach(el => {
				if (_.isArray(el) && el[0] === 'concat') {
					found = true
				}
			})
		} else {
			st.forEach(el => {
				if (_.isArray(el)) {
					recursiveFind(el)
				}
			})
		}
	}
	const parsedFormula = parseOjson.parseOscriptGrammar(formula)

	const res = parsedFormula.results[0]
	recursiveFind(res)
	return found
}

module.exports = concatenationInsideIf
