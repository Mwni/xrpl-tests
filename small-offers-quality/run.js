import fs from 'fs'
import Socket from '@xrplkit/socket'
import { Fund } from '@xrplkit/test'
import setup from './stages/setup.js'
import fillBook from './stages/fill-book.js'
import glitchOffer from './stages/glitch-offer.js'
import testEffectiveRate from './stages/test-effective-rate.js'


let configId = process.argv[2] || 'testnet'
let config

try{
	config = JSON.parse(fs.readFileSync(`configs/${configId}.json`))
	console.log(`using config "${configId}"`)
}catch{
	console.error(`config "${configId}" does not exist`)
	process.exit(1)
}

const socket = new Socket(config.node)

const fund = new Fund({ 
	socket,
	walletFile: `wallets.${configId}.json`,
	faucet: config.faucet,
	genesis: config.genesis
})

const tests = [
	{ buy: 'XAU', sell: 'XRP', price: '100' },
	//{ buy: 'XRP', sell: 'XAU', price: '0.01' },
	//{ buy: 'XAU', sell: 'USD', price: '10000' },
]


for(let { buy, sell, price } of tests){
	console.log(``)
	console.log(`*** test: buying ${buy} with ${sell} ***`)

	const ctx = { socket, fund, buy, sell, price }

	await setup(ctx)
	await fillBook(ctx)
	await glitchOffer(ctx)
	await testEffectiveRate(ctx)
}


process.exit(0)