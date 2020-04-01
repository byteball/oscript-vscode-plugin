// uses `aa-testkit` testing framework for AA tests. Docs can be found here `https://github.com/valyakin/aa-testkit`
// `mocha` standard functions and `expect` from `chai` are available globally
// `Testkit`, `Network`, `Nodes` and `Utils` from `aa-testkit` are available globally too
const AA_PATH = './example.aa'

describe('Check `just a bouncer` AA', function () {
	this.timeout(120000)

	before(async () => {
		this.network = await Network.create()
	})

	it('Check agent deployment', async () => {
		const network = this.network
		const genesis = await network.getGenesisNode().ready()

		const deployer = await network.newHeadlessWallet().ready()
		const deployerAddress = await deployer.getAddress()

		const wallet = await network.newHeadlessWallet().ready()
		const walletAddress = await wallet.getAddress()

		await genesis.sendBytes({ toAddress: deployerAddress, amount: 1000000 })
		const { unit } = await genesis.sendBytes({ toAddress: walletAddress, amount: 1000000 })
		await network.witnessUntilStable(unit)

		const { address: agentAddress, unit: agentUnit, error: deploymentError } = await deployer.deployAgent(AA_PATH)
		expect(deploymentError).to.be.null

		let walletBalance = await wallet.getBalance()

		expect(agentAddress).to.be.validAddress
		expect(agentUnit).to.be.validUnit
		expect(walletBalance.base.stable).to.be.equal(1000000)

		await network.witnessUntilStable(agentUnit)

		const { unit: newUnit } = await wallet.sendBytes({
			toAddress: agentAddress,
			amount: 10000
		})

		expect(newUnit).to.be.validUnit
		await network.witnessUntilStable(newUnit)

		walletBalance = await wallet.getBalance()
		expect(walletBalance.base.pending).to.be.equal(9000)
	}).timeout(60000)

	after(async () => {
		await this.network.stop()
	})
})
