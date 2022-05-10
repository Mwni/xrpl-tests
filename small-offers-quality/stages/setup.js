import Book from '@xrplkit/book'
import { fundWallets } from '../lib/wallet.js'
import { submit } from '../lib/tx.js'

export default async function(ctx){
	let { socket, config, test } = ctx
	let [ baseIssuer, quoteIssuer, honestTrader, rogueTrader, tester ] = await fundWallets({ socket, config, num: 5 })
	let wallets = { baseIssuer, quoteIssuer, honestTrader, rogueTrader, tester }

	let base = test.base === 'XRP'
		? { currency: 'XRP' }
		: { currency: test.base, issuer: baseIssuer.address }

	let quote = test.quote === 'XRP'
		? { currency: 'XRP' }
		: { currency: test.quote, issuer: quoteIssuer.address }

	let book = new Book({
		socket,
		takerPays: quote,
		takerGets: base,
	})

	console.log('configuring issuing accounts')

	for(let wallet of [baseIssuer, quoteIssuer]){
		await submit({
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

	return { ...ctx, wallets, base, quote, book }
}