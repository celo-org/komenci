# @komenci/cli

A collection of CLI tools used for funding relayers from the central fund and deploying MetaTransactionWallets for relayers.

> Commands differ when run in the package folder vs when running from the monorepo root, see the root README

In order to get started first run:

```bash
yarn build
```

Then we can run the tools like so:

```bash
env NETWORK=alfajores yarn start fund getRelayerBalance
```

> This command will resolve all relayers and wallets and query for their celo and cUSD balance respectively.

The tools cli depends on a network config that needs to be populated with the list of relayers.
There is no relayer discovery system in this release. Therefore we will manually add all the HSM addresses
in the config.

## Fund

The fund tools rely on access to a wallet.
For alfajores this can be a local wallet (private key), but in other envs this will use an HSM.

## Available commands

- `fund getFundBalance` - will query the fund's balance
- `fund getRelayerBalance` - will resolve all MTW associated with relayers and query for all balances
- `fund disburse` - will send cUSD to each relayer MTW and celo to each relayer, the amounts can be configured as flags.
