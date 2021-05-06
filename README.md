# Komenci

Komenci (F.K.A. Onboarding Service) is responsible for orchestrating fee-less onboarding for Valora.
It achieves this through the use of a Smart Contract Wallet that support Meta Transactions (MetaTransactionWallet.sol).

Each Valora user, which passes some safeguards (reCAPTCHA, DeviceCheck/SafetyNet) gets one such contract deployed and is allowed
to forward meta-transactions related to the verification flow to Komenci.

## Structure

A Nest monorepo project combines several independent applications.
These applications can be either full-blown HTTP servers or [microservices](https://docs.nestjs.com/migration-guide#microservices) where Nest provides us
with efficient and configurable transport mechanism.

There are 4 apps, which are meant as runnable programs, either as deployments or locally (for the CLI):

- [`@komenci/api`](./packages/apps/api) - (F.K.A. `onboarding`) The API that Valora interacts with
- [`@komenci/relayer`](./packages/apps/relayer) - The Meta Transaction relayer microservice that can be called to from other apps.
- [`@komenci/cli`](./packages/apps/cli) - (F.K.A. `tools`) Some useful CLI tools that aid in development/maintenance
- [`@komenci/rewards`](./packages/apps/rewrads) - A backend worker that monitors the chain and populates a database used for reward distriution

And some libraries which are used by the apps:

- [`@komenci/blockchain`](./packages/libs/blockchain) - Modules and services which aid in interacting with the chain and ContractKit, these modules make it easy to inject a setup ContractKit in other classes.
- [`@komenci/contracts`](./packages/libs/contracts) - Artefacts of the Komenci related contracts deployed on-chain 
- [`@komenci/core`](./packages/libs/core) - Collection of small utilities and configuration
- [`@komenci/kit`](./packages/libs/komencikit) - Client wrapper for the `@komenci/api`, used by Valora
- [`@komenci/logger`](./packages/libs/logger) - Logger module & service used for structured logging of errors and application events
- [`@komenci/throttler`](./packages/libs/throttler) - A thin extension for `@nestjs/throttler` that allows us to implement a sentinel endpoint to check the throttle status before attempting the actually throttled endpoint, which allows us to skip captcha checking in Valora

And one utility package:

- [`@komenci/load-testing`](./packages/load-testing) - Configuration and utility functions to perform load testing on Komenci using [Artillery](https://artillery.io/)

Out of these packages two will be published to NPM:

- `@komenci/kit' - it will be imported by Valora
- `@komenci/contracts` - `@komenci/kit` depends on it

## Installation

```bash
git clone git@github.com:celo-org/komenci.git
cd komenci
# Install Komenci dependencies
yarn 
```

### Database

The services rely on a SQL database to be running. Access can be configured through the config files.
To spin up postgres in Docker simply run:

```bash
docker run --rm  --name pg-docker -e POSTGRES_PASSWORD=komenci -u postgres -d -p 5432:5432 -v $HOME/docker/volumes/postgres:/var/lib/postgresql/data postgres
```

Make sure you either set up a komenci user and database and update the username (default "postgres") and database (default "postgres") according to the config files.

#### Configs

Setup local config files:

``` bash
cp packages/apps/api/.env.local.example packages/apps/api/.env.local
cp packages/apps/relayer/.env.local.example packages/apps/relayer/.env.local
cp packages/apps/rewards/.env.local.example packages/apps/rewards/.env.local
cp packages/apps/cli/.env.local.example packages/apps/cli/.env.local
```

## Running

There are a few different commands that can be used to run the services locally (all the following should be prefixed with yarn and ran at the top-level of the monorepo):

- `build:libs` - one time build function for all libs, can be run once during development if work is not being done on the libs
- `build:libs:dev` - starts a watcher for all libs and continuously rebuilds
- `build:cli` - builds the `cli` app once
- `build:cli:dev` - continuously rebuild the `cli` app
- `cli` - runs the `cli` app from the `dist` folder (must be built first)
- `build:<service>` - one time build function for the service app
- `start:<service>:prod` - start the service from the `dist` folder
- `start:<service>:dev` - build and start the service in watch mode, rebuilding and restarting on source changes

> `service` ∈ {`api`, `relayer`, `rewards`}

These commands can be used in various combination during development by starting in `watch` mode only the packages that are being worked on.

## Chain interaction

Currently, the required smart contracts from `celo-monorepo` are deployed using the migrations in `./packages/libs/blockchain/migrations`.
Tho the contracts live in `celo-monorepo` their artefacts are pulled into the `@komenci/contracts` package for deployment and in order to utilise the ABI.
The addresses for the contracts are loaded from `./packages/libs/core/src/network.config.ts`.
