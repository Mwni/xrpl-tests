import Book from '@xrplkit/book'
import { submitAndWait } from '@xrplkit/test'
import { createIssuer } from '../lib/iou.js'

export default async function(ctx){
	let { socket, fund, buy, sell } = ctx
	let sides = [
		{ currency: buy },
		{ currency: sell }
	]

	for(let side of sides){
		let { currency } = side

		if(currency !== 'XRP'){
			side.issuerWallet = await createIssuer({ 
				socket,
				fund,
				id: `issuer-${currency}` 
			})
			
			side.token = {
				currency,
				issuer: side.issuerWallet.address
			}
		}else{
			side.token = { 
				currency 
			}
		}
	}

	let book = new Book({
		socket,
		takerPays: { ...sides[1].token },
		takerGets: { ...sides[0].token },
	})

	ctx.book = book
	ctx.sides = sides
}