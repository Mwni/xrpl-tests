import Book from '@xrplkit/book'
import { submitAndWait } from '@xrplkit/test'

export default async function(ctx){
	let { socket, fund, buy, sell } = ctx
	let sides = [
		{ currency: buy },
		{ currency: sell }
	]

	for(let side of sides){
		let { currency } = side

		if(currency !== 'XRP'){
			side.isNewIssuingWallet = !await fund.hasWallet({id: `issuer-${currency}`})
			side.issuingWallet = await fund.getWallet({id: `issuer-${currency}`, balance: '1000'})
			side.token = {
				currency,
				issuer: side.issuingWallet.address
			}

			if(side.isNewIssuingWallet){
				console.log(`enabling rippling on issuing wallet ...`)

				await submitAndWait({
					socket,
					tx: {
						TransactionType: 'AccountSet',
						Account: side.issuingWallet.address,
						SetFlag: 8
					},
					seed: side.issuingWallet.seed,
					autofill: true
				})
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