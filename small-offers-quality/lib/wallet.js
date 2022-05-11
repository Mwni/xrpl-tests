import fetch from 'node-fetch'
import { submit } from '@xrplkit/submit'
import { deriveAddress, generateSeed } from '@xrplkit/wallet'


export async function fundWallets({ socket, config, num }){
	let counter = 0

	console.log(`we need ${num} test wallets ...`)

	if(config.faucet){
		return Promise.all(
			Array(num)
				.fill(0)
				.map(() => 
					fundWalletFromFaucet({ socket, faucet: config.faucet })
						.then(wallet => console.log(` > funded ${++counter}/${num} wallets`) || wallet)
				)
		)
	}else{
		let wallets = []

		for(let i=0; i<num; i++){
			wallets.push(await fundWalletFromGenesis({ socket, genesis: config.genesis }))
			console.log(` > funded ${++counter}/${num} wallets`)
		}

		return wallets
	}
}


async function fundWalletFromFaucet({ socket, faucet }){
	let response = await fetch(faucet.url, {method: 'POST'})

	if(response.ok){
		let { account } = await response.json()
		let wallet = {
			address: account.address,
			seed: account.secret
		}

		while(true){
			try{
				await socket.request({
					command: 'account_info',
					ledger_index: 'validated',
					account: wallet.address
				})
				break
			}catch(e){
				await new Promise(resolve => setTimeout(resolve, 1000))
			}
		}

		return wallet
	}else{
		throw new Error(`failed to call faucet endpoint (${response.status}): ${await response.text()}`)
	}
}

async function fundWalletFromGenesis({ socket, genesis }){
	let seed = generateSeed()
	let address = deriveAddress({ seed })
	let wallet = { seed, address }

	let result = await submit({
		socket,
		tx: {
			TransactionType: 'Payment',
			Account: deriveAddress(genesis),
			Destination: address,
			Amount: '1000000000'
		},
		...genesis,
		autofill: true
	})

	if(result.engine_result === 'tesSUCCESS'){
		return wallet
	}else{
		throw new Error(`failed to fund wallet from genesis: ${result.engine_result}`)
	}
}