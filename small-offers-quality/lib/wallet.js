import fetch from 'node-fetch'
import { submitAndWait } from '@xrplkit/submit'
import { deriveAddress, generateSeed } from '@xrplkit/wallet'
import { mul } from '@xrplkit/xfl/string'


export async function fundWallets({ socket, config, num }){
	let counter = 0

	console.log(`we need ${num} test wallets ...`)

	return Promise.all(
		Array(num).fill(0).map(async () => {
			let wallet = config.faucet
				? await fundWalletFromFaucet({ socket, faucet: config.faucet })
				: await fundWalletFromGenesis({ socket, genesis: config.genesis })

			console.log(` > funded ${++counter}/${num} wallets`)

			return wallet
		})
	)
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

	let result = await submitAndWait({
		socket: this.socket,
		tx: {
			TransactionType: 'Payment',
			Account: deriveAddress(genesis),
			Destination: address,
			Amount: mul(balance, '1000000')
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