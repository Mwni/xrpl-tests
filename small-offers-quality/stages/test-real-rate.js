import { submit } from '@xrplkit/test'
import { mul, div } from '@xrplkit/xfl/string'
import { toRippled } from '@xrplkit/amount'


export default async function ({ socket, fund, sides, book, buy, sell }){
	console.log(`starting testing series`)

	let testWallet = await fund.getWallet({id: `test-${buy}-${sell}`})

	for(let i=0; i<25; i++){
		console.log(`trying to buy ${i * 10}% above market price ...`)

		let total = '1'
		let price = mul(book.bestPrice, 1 + i * 0.1)
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
			console.log(`real exchange rate was ${i * 10}% above market price`)
			break
		}
	}
}