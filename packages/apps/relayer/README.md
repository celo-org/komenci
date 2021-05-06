# @komenci/relayer

The service that powers chain interactions in the komenci ecosystem. A relayer wraps an HSM or a private key (locally) and exposes an RPC for transaction submission.
Its meant to be accessed as a stateless worker behind a load-balancer by other applications that need to execute transactions.

The main features are:

- Enforce sequential nonce with parallel access, or out of sync nodes
- Dead-letter transactions to ensure execution doesn't stall
- Monitor and react tp gas prices
- Intermediate ODIS communication by relying on it's own credit
- Execute atomic transaction batches via a MetaTransactionWallet
