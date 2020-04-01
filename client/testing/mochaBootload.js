/* eslint-disable chai-friendly/no-unused-expressions */
const path = require('path')
const chai = require('chai')
const expect = chai.expect
const { Testkit } = require('aa-testkit')
const { Network, Nodes, Utils } = Testkit({
	TESTDATA_DIR: path.join(process.env.VSCODE_WORKSPACE_DIR, 'testdata')
})

global.expect = expect
global.Testkit = Testkit

global.Network = Network
global.Nodes = Nodes
global.Utils = Utils

chai.Assertion.addChainableMethod('validAddress', (address) => {
	new chai.Assertion(Utils.isValidAddress(address)).to.be.true
})

chai.Assertion.addChainableMethod('validUnit', (unit) => {
	new chai.Assertion(Utils.isValidBase64(unit)).to.be.true
})
