import { submit } from './tx.js'


export async function fundTrader({ traderWallet, issuerWallet, currency, value, socket }){
	await submit({
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

	await submit({
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