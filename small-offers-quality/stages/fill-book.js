import { submitAndWait } from '@xrplkit/test'
import { mul } from '@xrplkit/xfl/string'
import { toRippled } from '@xrplkit/amount'


export default async function({ socket, fund, book, sides, price }){
	await book.load()

	if(book.offers.length === 0){
		console.log(`creating counterparty book ...`)

		let assetIssuingWallet = sides[0].issuingWallet
		let makerCurrency = sides[0].currency
		let makerNew = !fund.hasWallet({id: `maker-${makerCurrency}`})
		let makerWallet = await fund.getWallet({id: `maker-${makerCurrency}`, balance: '1000'})

		if(makerNew && makerCurrency !== 'XRP'){
			console.log(`funding market maker with 1M ${makerCurrency} ...`)

			await submitAndWait({
				socket,
				tx: {
					TransactionType: 'TrustSet',
					Account: makerWallet.address,
					LimitAmount: {
						currency: makerCurrency,
						issuer: assetIssuingWallet.address,
						value: '1000000'
					},
					Flags: 0x00020000
				},
				seed: makerWallet.seed,
				autofill: true
			})

			await submitAndWait({
				socket,
				tx: {
					TransactionType: 'Payment',
					Account: assetIssuingWallet.address,
					Destination: makerWallet.address,
					Amount: {
						currency: makerCurrency,
						issuer: assetIssuingWallet.address,
						value: '1000000'
					}
				},
				seed: assetIssuingWallet.seed,
				autofill: true
			})
		}
		
		for(let i=0; i<3; i++){
			let paysValue = mul(price, 1 + i * 0.025)
			let getsValue = '1'

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