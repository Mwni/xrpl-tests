import fs from 'fs'
import Socket from '@xrplkit/socket'
import setup from './stages/setup.js'
import fillBook from './stages/fill-book.js'
import glitchOffer from './stages/glitch-offer.js'
import testEffectiveRate from './stages/test-effective-rate.js'
import { sum } from '@xrplkit/xfl/string'
import { lte } from '@xrplkit/xfl'


const initialValue = '0.01'
const nudgeFactor = '1.17'
const rateIncreasePerStep = 0.025


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
	//{ base: 'XRP', quote: 'XAU', price: '0.01' },
	//{ base: 'USD', quote: 'XAU', price: '0.000001' },
]


for(let test of tests){
	console.log(`*** test: buying ${test.base} with ${test.quote} ***`)

	let ctx = { config, socket, test, initialValue, nudgeFactor, rateIncreasePerStep }

	ctx = await setup(ctx)
	ctx = await fillBook(ctx)
	//ctx = await glitchOffer(ctx)
	//ctx = await testEffectiveRate(ctx)

	let current = '0.5'
	let end = '10'
	let step = '0.1'
	let table = []

	while(lte(current, end)){
		let nCtx = await glitchOffer({ ...ctx, nudgeFactor: current })
		let { increase } = await testEffectiveRate(nCtx)

		table.push({ nudge: current, increase })
		console.log(table)
		
		current = sum(current, step)
	}
}


process.exit(0)