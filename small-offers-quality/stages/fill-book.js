import { submitAndWait } from '@xrplkit/test'
import { mul } from '@xrplkit/xfl/string'
import { toRippled } from '@xrplkit/amount'
import { fundTrader } from '../lib/iou.js'


export default async function({ socket, fund, book, sides, price }){
	await book.load()

	if(book.offers.length === 0){
		console.log(`creating counterparty book`)

		let issuerWallet = sides[0].issuerWallet
		let makerCurrency = sides[0].currency
		let makerNew = !fund.hasWallet({id: `maker-${makerCurrency}`})
		let makerWallet = await fund.getWallet({id: `maker-${makerCurrency}`, balance: '1000'})

		if(makerNew && makerCurrency !== 'XRP'){
			console.log(`funding market making wallet`)
			await fundTrader({
				socket,
				fund,
				traderWallet: makerWallet, 
				issuerWallet, 
				currency: makerCurrency,
				value: '100000' 
			})
		}
		
		for(let i=0; i<3; i++){
			let incrementalPrice = mul(price, 1 + i * 0.025)
			let getsValue = '100'
			let paysValue = mul(getsValue, incrementalPrice)

			await submitAndWait({
				socket,
				tx: {
					TransactionType: 'OfferCreate',
					Account: makerWallet.address,
					TakerPays: toRippled({
						...sides[1].token,
						value: paysValue
					}),
					TakerGets: toRippled({
						...sides[0].token,
						value: getsValue
					}),
				},
				seed: makerWallet.seed,
				autofill: true
			})
		}

		await book.load()
	}
}