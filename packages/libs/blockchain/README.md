# @komenci/blockchain

NestJS modules and services that make interacting with the Celo blockchain easier.
Main features:

- Setup providers for blockchain related entities so that they can be injected via Nest's dependency management (e.g.: ContractKit, Web3)
- Wrappers for injecting some of the common used contracts
- Wallet providers
- Handles the chain migrations, contract deployment

Currently, the required smart contracts from `celo-monorepo` are deployed using the migrations in `./packages/libs/blockchain/migrations`.
Tho the contracts live in `celo-monorepo` their artefacts are pulled into the `@komenci/contracts` package for deployment and in order to utilise the ABI.
The addresses for the contracts are loaded from `./packages/libs/core/src/network.config.ts`.
