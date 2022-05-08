import xrpl from 'xrpl'
import fetch from 'node-fetch'

let client = new xrpl.Client('wss://s.altnet.rippletest.net:51233')
let wallet

await client.connect()

{
	let response = await fetch('https://faucet.altnet.rippletest.net/accounts', { method: 'POST' })
	let { account } = await response.json()

	wallet = xrpl.Wallet.fromSeed(account.secret)
}

console.log(`using account "${wallet.address}"`)

// uncomment this to alleviate the issue
// await new Promise(resolve => setTimeout(resolve, 5000))


let tx = await client.autofill({
	TransactionType: 'AccountSet',
	Account: wallet.classicAddress,
	SetFlag: 8
})

console.log(`submitting tx:`)
console.log(tx)

let { result } = await client.submit(tx, { wallet })
let submissionTime = Date.now()

console.log(`result:`, result.engine_result)


while(true){
	await new Promise(resolve => setTimeout(resolve, 1000))

	let passedSeconds = Math.floor((Date.now() - submissionTime) / 1000)

	let { result: tx } = await client.request({
		command: 'tx',
		transaction: result.tx_json.hash
	})

	console.log(`validated after ${passedSeconds}s:`, tx.validated)

	if(tx.validated)
		break

	if(passedSeconds > 20){
		console.log(`20 seconds have passed now, without the transaction being validated.`)
		console.log(`let's submit the same transaction again...`)

		let { result } = await client.submit(tx, { wallet })

		console.log(`result:`, result.engine_result)
		break
	}
}

await client.disconnect()