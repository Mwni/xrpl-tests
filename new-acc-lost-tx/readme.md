# Newly funded accounts sequence causes undeterministic transaction outcomes
### A XRPL Test Case

## The Issue

When a new account is funded, and its new `AccountRoot` has not been validated, yet, creating a transaction from this new account results in a bug in consensus algorithm, such that:

1. The transaction gets accepted with `tesSUCCESS`
2. The transaction then gets discarded
3. The transaction remains in the nodes cache
4. Resubmitting the same transaction, results in `tefPAST_SEQ`

This effectively makes it impossible to determine the outcome of the transaction, and a second submission with increased `Sequence` could result in the transaction being executed twice.

Install dependencies by running
```
npm install
```

to install any dependencies. Then run

```
node run
```