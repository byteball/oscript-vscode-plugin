module.exports = {
  "root": true,
  "extends": "standard",
  env: {
    node: true,
  },
  "globals": {
    requireRoot: true,
    expect: true
  },
  "rules": {
    'indent': ['error', 'tab'],
		'no-tabs': 'off',
		"no-unused-expressions": 0,
		'no-console': 'error',
		'no-debugger': 'error'
  }
}
