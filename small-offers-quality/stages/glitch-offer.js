import { submitAndWait } from '@xrplkit/test'
import { mul, div, sub, floor } from '@xrplkit/xfl/string'
import { toRippled } from '@xrplkit/amount'
import { fundTrader } from '../lib/iou.js'


const nudgeFactor = '1.17'


export default async function({ socket, fund, book, sides, buy, sell }){
	let attackingWallet = await fund.getWallet({id: `attacker-${buy}-${sell}`})
	let payToken = sides[0].token
	let getToken = sides[1].token
	let smallestUnit = getToken.currency === 'XRP'
		? '0.000001'
		: '0.000000000000000000000000000000000000000000000000000000000000000000000000000000001'
		

	/*if(payToken.currency !== 'XRP'){
		console.log(`funding attacker`)
		await fundTrader({ 
			socket,
			fund,
			traderWallet: attackingWallet, 
			issuerWallet: sides[0].issuerWallet,
			currency: payToken.currency,
			value: '1'
		})

		await attackingAccount.loadLines()
	
		balance = attackingAccount.balanceOf(payToken)
	}else{
		await attackingAccount.loadInfo()

		balance = attackingAccount.balance
	}*/
	

	let targetPrice = mul(book.bestPrice, '0.99')
	let offerPay = '1'
	let offerGet = mul(offerPay, targetPrice)
	let cripplingGet = mul(smallestUnit, nudgeFactor)
	let cripplingPay = mul(div(cripplingGet, offerGet), offerPay)
	let burnValue = sub(offerPay, cripplingPay)

	console.log(`offer target price: ${targetPrice} ${payToken.currency}/${getToken.currency}`)
	console.log(`offer initial takerPays: ${offerGet} ${getToken.currency}`)
	console.log(`offer initial takerGets: ${offerPay} ${payToken.currency}`)
	console.log(`offer crippled takerPays: ${cripplingGet} ${getToken.currency}`)
	console.log(`offer crippled takerGets: ${cripplingPay} ${payToken.currency}`)
	console.log(`burn target: ${burnValue} ${payToken.currency}`)


	if(payToken.currency !== 'XRP'){
		await fundTrader({ 
			socket,
			fund,
			traderWallet: attackingWallet, 
			issuerWallet: sides[0].issuerWallet,
			currency: payToken.currency,
			value: cripplingPay
		})
	}


	await submitAndWait({
		socket,
		tx: {
			TransactionType: 'OfferCreate',
			Account: attackingWallet.address,
			TakerPays: toRippled({
				...getToken,
				value: offerGet
			}),
			TakerGets: toRippled({
				...payToken,
				value: offerPay
			}),
		},
		seed: attackingWallet.seed,
		autofill: true
	})

	if(payToken.currency === 'XRP'){
		console.log(`disposing of balance`)

		let fee = floor(sub(mul(burnValue, '1000000'), '1'))

		await submitAndWait({
			socket,
			tx: {
				TransactionType: 'Payment',
				Account: attackingWallet.address,
				Destination: getToken.issuer,
				Amount: '1',
				Fee: fee
			},
			seed: attackingWallet.seed,
			autofill: true
		})
	}
}