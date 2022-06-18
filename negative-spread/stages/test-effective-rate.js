import { mul, div } from '@xrplkit/xfl/string'
import { toRippled } from '@xrplkit/amount'
import { fundTrader } from '../lib/iou.js'
import { submit } from '../lib/tx.js'


export default async function (ctx){
	let { socket, book, wallets, base, quote, rateIncreasePerStep } = ctx

	await book.load()

	console.log(`glitched offer:`, book.offers[0])
	console.log(`starting testing series in ${rateIncreasePerStep * 100}% increments`)

	if(quote.currency !== 'XRP'){
		await fundTrader({
			socket,
			traderWallet: wallets.tester,
			issuerWallet: wallets.quoteIssuer,
			currency: quote.currency,
			value: '1'
		})
	}


	for(let i=0; i<1000000; i++){
		let total = '1'
		let price = mul(book.bestPrice, 1 + i * rateIncreasePerStep)
		let units = div(total, price)
		let result = await submit({
			socket,
			tx: {
				TransactionType: 'OfferCreate',
				Account: wallets.tester.address,
				TakerPays: toRippled({
					...base,
					value: units
				}),
				TakerGets: toRippled({
					...quote,
					value: total
				}),
				Flags: 0x00040000 | 0x00080000
			},
			seed: wallets.tester.seed,
			autofill: true
		})

		if(result.engine_result === 'tesSUCCESS'){
			console.log(`effective exchange rate was ${i * rateIncreasePerStep * 100}% above market`)
			console.log(`tx hash: ${result.tx_json.hash}`)
			return { increase: i * rateIncreasePerStep }
		}
	}
}