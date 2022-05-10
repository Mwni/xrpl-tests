import fs from 'fs'
import Socket from '@xrplkit/socket'
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

const tests = [
	{ base: 'XAU', quote: 'XRP', price: '100' },
	//{ buy: 'XRP', sell: 'XAU', price: '0.01' },
	//{ buy: 'USD', sell: 'XAU', price: '0.01' },
]


for(let test of tests){
	console.log(`*** test: buying ${test.base} with ${test.quote} ***`)

	let ctx = { config, socket, test }

	ctx = await setup(ctx)
	ctx = await fillBook(ctx)
	ctx = await glitchOffer(ctx)
	ctx = await testEffectiveRate(ctx)
}


process.exit(0)