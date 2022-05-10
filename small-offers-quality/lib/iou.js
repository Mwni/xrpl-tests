import { submitAndWait } from '@xrplkit/test'


export async function createIssuer({ id, socket, fund }){
	let isNew = !fund.hasWallet({ id })
	let wallet = await fund.getWallet({ id, balance: '1000' })
			

	if(isNew){
		console.log(`enabling rippling on issuing wallet ...`)

		await submitAndWait({
			socket,
			tx: {
				TransactionType: 'AccountSet',
				Account: wallet.address,
				SetFlag: 8
			},
			seed: wallet.seed,
			autofill: true
		})
	}

	return wallet
}


export async function fundTrader({ traderWallet, issuerWallet, currency, value, socket }){
	await submitAndWait({
		socket,
		tx: {
			TransactionType: 'TrustSet',
			Account: traderWallet.address,
			LimitAmount: {
				currency,
				issuer: issuerWallet.address,
				value: '1000000000'
			},
			Flags: 0x00020000
		},
		seed: traderWallet.seed,
		autofill: true
	})

	await submitAndWait({
		socket,
		tx: {
			TransactionType: 'Payment',
			Account: issuerWallet.address,
			Destination: traderWallet.address,
			Amount: {
				currency,
				issuer: issuerWallet.address,
				value
			}
		},
		seed: issuerWallet.seed,
		autofill: true
	})
}