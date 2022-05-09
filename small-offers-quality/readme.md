# Marginally funded offers block offer book and cause negative spreads
### A XRPL Test Case

## The Issue

Offers with marginal funding end up having a different exchange rates due to floating point precision errors.
The change in exchange rate does not change the position of the offer in the book directory, which causes the ledger engine to misinterpret the true exchange rate of all following offers.

## How to reproduce

1. Create a offer
2. Discard offered funds from maker's account, so that either the value of `TakerPays` or `TakerGets` will amount to between 1 and 2 of the smallest divisible unit of the respective currency.
3. Retain offer and balance of maker's account to effectively lock out all honest market participants from consuming the book.

## How to fix

The fix is relatively easy: Create a opposing offer that is more than 80% above the apparent market price. The offer's total can be as low as 2 drops.
The reason why this issue generally does not resolve itself, is because such offers are rarely made.


## Run the test

Install dependencies by running
```
npm install
```

to install any dependencies.

To run in a default testnet setup, run

```
node run testnet
```

To run the test against a standalone rippled mode, run

```
node run standalone
```

Make sure to adjust the node URL and Port in `configs/standalone.json`.