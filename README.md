# Komenci

Komenci (F.K.A. Onboarding Service) is responsible for orchestrating fee-less onboarding for Valora.
It achieves this through the use of a Smart Contract Wallet that support Meta Transactions (MetaTransactionWallet.sol).

Each Valora user, which passes some safeguards (reCAPTCHA, DeviceCheck/SafetyNet) gets one such contract deployed and is allowed
to forward meta-transactions related to the verification flow to Komenci.

## Structure

A Nest monorepo project combines several independent applications and libraries which are used by these applications.
These applications can be either full-blown HTTP servers or [microservices](https://docs.nestjs.com/migration-guide#microservices) where Nest provides us
with efficient and configurable transport mechanism.
In our case we have:

- `apps/onboarding` - the Onboarding Service 
- `apps/relayer` - the Relayer Service which is a TCP microservice
- `libs/blockchain` - a library which wraps contract-kit
- `libs/celo` - (:warning: NOT A NESTJS LIBRARY) `celo-monorepo` as a submodule - this allows us to import and use packages that haven't been released on NPM

## Installation

```bash
git clone git@github.com:celo-org/komenci.git
cd komenci
# Install Komenci dependencies
yarn 
npm install -g @nestjs/cli
# `celo-monorepo` is a git submodule -- update downloads it in place
git submodule update --init
# install `celo-monorepo` dependencies
yarn deps:celo:install
yarn deps:celo:build
```

Occasionally, you may need to pull in changes from `celo-monorepo`. To update it, run the following:

```bash
git submodule update --remote libs/celo
yarn deps:celo:build
```

#### Database

The services rely on a SQL database to be running. Access can be configured through the config files.
To spin up postgres in Docker simply run 

```bash
# run postgres
docker run --rm  --name pg-docker -e POSTGRES_PASSWORD=komenci -u postgres -d -p 5432:5432 -v $HOME/docker/volumes/postgres:/var/lib/postgresql/data postgres
```

Make sure you either set up a komenci user and database and update the username (default "postgres") and database (default "postgres") according to the config files.

#### Configs

Setup local config files:

```bash
cp apps/onboarding/.env.local.example apps/onboarding/.env.local
cp apps/onboarding/.env.local.example apps/onboarding/.env.test
cp apps/relayer/.env.local.example apps/relayer/.env.local
cp apps/relayer/.env.local.example apps/relayer/.env.test
```

### Notes on `celo-monorepo`

The reason for including `celo-monorerpo` as a submodule is because currently there's no other way to include unreleased packages from a monorepo in another repo.
So Komenci would be bound by the release cycle of `celo-monorepo` packages. This might be fine in the future and, because of the way the integration is configured, 
it will not require a big change - just removing the path transformations in `tsconfig.json`, and we can move back to `@celo/<package>` from NPM.

When changes to `celo-monorerpo` packages have to be pulled in the build steps will be rerun and potentially extended if more packages are imported by Komenci.

## Running

```bash
# Start the relayer in one terminal:
$ yarn start:dev relayer
# Start the onboarding service in another
$ yarn start:dev onboarding
```

By default the onboarding service should be pointing to the port of the relayer.
Starting with `start:dev` will run webpack in watch mode and will rebuild when files change.

## Chain interaction

Currently, the required smart contracts from `celo-monorepo` are deployed on Alfajores using the migrations in `./libs/blockchain/migrations`.
This is a _test_ deployment used for development and does not necessarily reflect the mainnet deployment process.
The addresses for the contracts are loaded from `./apps/relayer/.env.local`.

## Load balancing

In order to play around with load-balancing the relayers there's a toy haproxy config and a docker-compose that spins up a network which looks like:

```bash
                                        *-------------------*
                                   o----| Relayer 1: 0xaaaa |
*-------------*      *---------*   |    *-------------------*   
| Onboarding  |------| HAProxy |---o
|  Service    |      *---------*   |    *-------------------*
*-------------*                    o----| Relayer 2: 0xbbbb |
                                        *-------------------*
```

To test it out run:

```bash
docker-compose -f docker-compose.proxy.yml up
```

This should build everything and spin up the network. 
It might take 1-2 seconds for HAProxy to pick up the relayers once they're online. You should see this:

```bash
relayer_proxy_1  | [WARNING] 245/063307 (6) : Server relayer_pool/relayer2 is UP, reason: Layer4 check passed, check duration: 0ms. 1 active and 0 backup servers online. 0 sessions requeued, 0 total in queue.
relayer_proxy_1  | [WARNING] 245/063307 (6) : Server relayer_pool/relayer1 is UP, reason: Layer4 check passed, check duration: 0ms. 2 active and 0 backup servers online. 0 sessions requeued, 0 total in queue.
```

After that navigate to [localhost:3000/distributedBlindedPepper](http://localhost:3000/distributedBlindedPepper) and you should see the payload composed in `apps/relayer/src/relayer.service.ts` and we can see how relayers are rotated.

## Relayer funding (and the `tools` app)

For the first release Relayer funding happens manually by using the `tools` app which is a Commander CLI.
In order to get started first run:

```bash
nest build tools
```

Then we can run the tools like so:

```bash
env NETWORK=alfajores yarn tools fund getRelayerBalance
```

> This command will resolve all relayers and wallets and query for their celo and cUSD balance respectively.

The tools cli depends on a network config that needs to be populated with the list of relayers.
There is no relayer discovery system in this release. Therefore we will manually add all the HSM addresses
in the config.

### Fund

The fund tools relly on access to a wallet.
For alfajores this can be a local wallet (private key), but in other envs this will use an HSM.

> TODO: Figure out if there's anything special that needs to happen to connect to Azure and access the HSM.

### Available commands:

- `fund getFundBalance` - will query the fund's balance
- `fund getRelayerBalance` - will resolve all MTW associated with relayers and query for all balances
- `fund disburse` - will send cUSD to each relayer MTW and celo to each relayer, the amounts can be configured as flags.

## reCAPTCHA Testing

You may bypass the reCAPTCHA check by setting the following env variables:

```bash
export RULE_CAPTCHA_CONFIG_BYPASS_ENABLED=true
export RULE_CAPTCHA_CONFIG_BYPASS_TOKEN=special-captcha-bypass-token
```

This will allow you to pass in `special-captcha-bypass-token` as a successful reCAPTCHA solution.

You may also want to test the reCAPTCHA end-to-end. You can easily do so by [running the onboarding service](#running) locally and navigating to `http://localhost:3000/recaptcha-test.html`. This will produce a token which you may use to manually test the service. Note that the expiry of a token is two minutes. Both client-side site keys can be found [in the html](./apps/onboarding/public/recaptcha-test.html) and can be swapped manually depending on which environment you'd like to get a token for.

## Database migration

In order to create the tables in the database that has the structure of our Session we should run the following command: 

```yarn run typeorm:cli schema:sync```

The entities that we are going to update are in the file migration.config.json. If for any reason a migration is needed (ex. some field in the database changed) we should run the following command:

``` yarn run typeorm:cli migration:run ```

More detailed documentation about the proccess can be found in the following [link](https://typeorm.io/#/migrations/creating-a-new-migration).
