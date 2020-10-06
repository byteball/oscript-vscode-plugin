const { TYPES } = require('ocore/formula/parse_ojson')
const strRules = require('./str')
const formulaRules = require('./formula')

function applyRules (checks, st, rules) {
	const triggeredChecks = []

	rules.forEach(rule => {
		triggeredChecks.push.apply(triggeredChecks, rule(st.value))
	})

	checks.push.apply(checks, triggeredChecks.map(check => check.unwrapCheck(st.context, st.value)))
}

function treeTraversal (checks, st) {
	if (st.type === TYPES.ARRAY) {
		st.value.forEach(t => treeTraversal(checks, t))
	} else if (st.type === TYPES.STR) {
		applyRules(checks, st, strRules)
	} else if (st.type === TYPES.FORMULA) {
		applyRules(checks, st, formulaRules)
	} else if (st.type === TYPES.OBJECT) {
		st.value.forEach(t => treeTraversal(checks, t))
	} else if (st.type === TYPES.PAIR) {
		treeTraversal(checks, st.key)
		treeTraversal(checks, st.value)
	}
}

function inspectRules (parsed) {
	const checks = []
	treeTraversal(checks, parsed)
	return checks
}

module.exports = {
	inspectRules
}
