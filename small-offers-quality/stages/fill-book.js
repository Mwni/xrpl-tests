import { mul } from '@xrplkit/xfl/string'
import { toRippled } from '@xrplkit/amount'
import { submit } from '../lib/tx.js'
import { fundTrader } from '../lib/iou.js'


export default async function(ctx){
	let { socket, config, book, test, wallets, base, quote } = ctx

	console.log(`creating virtual counterparty book`)

	if(base.currency !== 'XRP'){
		console.log(`funding market making wallet`)

		await fundTrader({
			socket,
			traderWallet: wallets.honestTrader, 
			issuerWallet: wallets.baseIssuer, 
			currency: base.currency,
			value: '100000' 
		})
	}

	console.log(`creating 3 simulated offers`)
	
	for(let i=0; i<3; i++){
		let incrementalPrice = mul(test.price, 1 + i * 0.025)
		let getsValue = '100'
		let paysValue = mul(getsValue, incrementalPrice)

		await submit({
			socket,
			tx: {
				TransactionType: 'OfferCreate',
				Account: wallets.honestTrader.address,
				TakerPays: toRippled({
					...quote,
					value: paysValue
				}),
				TakerGets: toRippled({
					...base,
					value: getsValue
				}),
			},
			seed: wallets.honestTrader.seed,
			autofill: true
		})
	}


	while(book.offers.length === 0){
		await new Promise(resolve => setTimeout(resolve, 500))
		await book.load()
	}


	return ctx
}