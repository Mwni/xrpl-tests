import { submit, submitAndWait } from '@xrplkit/test'
import { mul, div } from '@xrplkit/xfl/string'
import { toRippled } from '@xrplkit/amount'
import { fundTrader } from '../lib/iou.js'

const rateIncreasePerStep = 0.025


export default async function ({ socket, fund, sides, book, buy, sell }){
	await book.load()

	console.log(`glitched offer:`, book.offers[0])
	console.log(`starting testing series`)

	let testWallet = await fund.getWallet({id: `test-${buy}-${sell}`})
	let spendSide = sides[1]


	if(spendSide.currency !== 'XRP'){
		await fundTrader({
			socket,
			fund,
			traderWallet: testWallet,
			issuerWallet: spendSide.issuerWallet,
			currency: spendSide.currency,
			value: '1'
		})
	}


	for(let i=0; i<100; i++){
		let total = '1'
		let price = mul(book.bestPrice, 1 + i * rateIncreasePerStep)
		let units = div(total, price)
		let result = await submit({
			socket,
			tx: {
				TransactionType: 'OfferCreate',
				Account: testWallet.address,
				TakerPays: toRippled({
					...sides[0].token,
					value: units
				}),
				TakerGets: toRippled({
					...sides[1].token,
					value: total
				}),
				Flags: 0x00040000 | 0x00080000
			},
			seed: testWallet.seed,
			autofill: true
		})

		if(result.engine_result === 'tesSUCCESS'){
			console.log(`effective exchange rate was ${i * rateIncreasePerStep * 100}% above market`)
			break
		}
	}
}