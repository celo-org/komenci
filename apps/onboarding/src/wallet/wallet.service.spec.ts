import { BlockchainModule, ContractsModule } from '@app/blockchain'
import { NodeProviderType } from '@app/blockchain/config/node.config'
import { normalizeMethodId } from '@app/blockchain/utils'
import { KomenciLoggerModule } from '@app/komenci-logger'
import { appConfig, AppConfig } from '@app/onboarding/config/app.config'
import { RelayerProxyService } from '@app/onboarding/relayer/relayer_proxy.service'
import { Session } from '@app/onboarding/session/session.entity'
import { SessionService } from '@app/onboarding/session/session.service'
import { buildMockWeb3Provider } from '@app/onboarding/utils/testing/mock-web3-provider'
import { MetaTxValidationErrorTypes, WalletErrorType } from '@app/onboarding/wallet/errors'
import { WalletService } from '@app/onboarding/wallet/wallet.service'
import { NetworkConfig, networkConfig } from '@app/utils/config/network.config'
import { normalizeAddress } from '@celo/base'
import { ContractKit } from '@celo/contractkit'
import { toRawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { MetaTransactionWalletDeployerWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWalletDeployer'
import { Test, TestingModule } from '@nestjs/testing'
import Web3 from 'web3'

jest.mock('@app/komenci-logger/komenci-logger.service')
jest.mock('@app/onboarding/relayer/relayer_proxy.service')
jest.mock('@app/onboarding/session/session.service')
Web3.providers.HttpProvider = buildMockWeb3Provider(() => null)

describe("WalletService", () => {
  const buildModule = async (appCfg: Partial<AppConfig>, networkCfg: Partial<NetworkConfig>) => {
    return Test.createTestingModule({
      imports: [
        KomenciLoggerModule.forRoot(),
        BlockchainModule.forRootAsync({
          useFactory: () => {
            return {
              node: {
                providerType: NodeProviderType.HTTP,
                url: "not-a-node"
              }
            }
          }
        }),
        ContractsModule.forRootAsync({
          useFactory: () => {
            return {
              deployerAddress: Web3.utils.randomHex(20)
            }
          },
        }),
      ],
      providers: [
        WalletService,
        RelayerProxyService,
        SessionService,
        {
          provide: appConfig.KEY,
          useValue: appCfg
        },
        {
          provide: networkConfig.KEY,
          useValue: networkCfg
        },
      ]
    }).compile()
  }

  describe('#extractMetaTxData', () => {
    describe('with a random transaction', () => {
      it('returns a DecodeError', async () => {
        const module = await buildModule({}, {})
        const walletService = module.get(WalletService)
        const contractKit = module.get(ContractKit)

        const attestations = await contractKit.contracts.getAttestations()
        const testTx = toRawTransaction(
            (await attestations.request("0x0", 3)).txo
        )
        const res = await walletService.extractMetaTxData(testTx)

        expect(res.ok).toBe(false)
        if (res.ok === false) {
          expect(res.error.errorType).toBe(MetaTxValidationErrorTypes.InputDecodeError)
        }
      })

      it('returns an InvalidRootMethod', async () => {
        const module = await buildModule({}, {})
        const walletService = module.get(WalletService)
        const contractKit = module.get(ContractKit)

        const wallet = await contractKit.contracts.getMetaTransactionWallet(Web3.utils.randomHex(20))
        const testTx = toRawTransaction(wallet.setSigner(Web3.utils.randomHex(20)).txo)

        const res = await walletService.extractMetaTxData(testTx)

        expect(res.ok).toBe(false)
        if (res.ok === false) {
          expect(res.error.errorType).toBe(MetaTxValidationErrorTypes.InvalidRootMethod)
        }
      })
    })

    describe('with a meta transaction', () => {
      describe('which is correct', () => {
        it('returns the methodId and destination!', async () => {
          const module = await buildModule({}, {})
          const walletService = module.get(WalletService)
          const contractKit = module.get(ContractKit)

          const attestations = await contractKit.contracts.getAttestations()
          const wallet = await contractKit.contracts.getMetaTransactionWallet(Web3.utils.randomHex(20))
          const testTx = toRawTransaction(
            wallet.executeMetaTransaction(
              attestations.selectIssuers("0x0").txo,
              {v: 0, r: "0x0", s: "0x0"}
            ).txo
          )
          const res = await walletService.extractMetaTxData(testTx)

          expect(res.ok).toBe(true)
          if (res.ok === true) {
            expect(res.result).toMatchObject({
              methodId: normalizeMethodId(attestations.methodIds.selectIssuers),
              destination: normalizeAddress(attestations.address)
            })
          }
        })
      })
    })
  })


  describe('#isAllowedMetaTransaction', () => {
    describe('with a meta transaction', () => {
      describe('pointing to an invalid destination', () => {
        it('returns an InvalidDestination error', async () => {
          const module = await buildModule({}, {})
          const walletService = module.get(WalletService)
          const contractKit = module.get(ContractKit)
          const walletAddress = Web3.utils.randomHex(20)

          const attestations = await contractKit.contracts.getAttestations()
          const stableToken = await contractKit.contracts.getStableToken()
          const wallet = await contractKit.contracts.getMetaTransactionWallet(walletAddress)
          const testTx = toRawTransaction(
            wallet.executeMetaTransaction(
              stableToken.transfer(Web3.utils.randomHex(20), "10000").txo,
              {v: 0, r: "0x0", s: "0x0"}
            ).txo
          )

          const txMetadata = await walletService.extractMetaTxData(testTx)
          expect(txMetadata.ok).toBe(true)

          if (txMetadata.ok === true) {
            const res = await walletService.isAllowedMetaTransaction(
                txMetadata.result,
                walletAddress,
                [
                  {
                    destination: attestations.address,
                    methodId: attestations.methodIds.request
                  }
                ]
            )

            expect(res.ok).toBe(false)
            if (res.ok === false) {
              expect(res.error.errorType).toBe(MetaTxValidationErrorTypes.InvalidDestination)
            }
          }
        })
      })

      describe('pointing to an invalid method', () => {
        it('returns an InvalidChildMethod error', async () => {
          const module = await buildModule({}, {})
          const walletService = module.get(WalletService)
          const contractKit = module.get(ContractKit)
          const walletAddress = Web3.utils.randomHex(20)

          const attestations = await contractKit.contracts.getAttestations()
          const wallet = await contractKit.contracts.getMetaTransactionWallet(walletAddress)
          const testTx = toRawTransaction(
              wallet.executeMetaTransaction(
                  attestations.selectIssuers("0x0").txo,
                  {v: 0, r: "0x0", s: "0x0"}
              ).txo
          )

          const txMetadata = await walletService.extractMetaTxData(testTx)
          expect(txMetadata.ok).toBe(true)

          if (txMetadata.ok === true) {
            const res = await walletService.isAllowedMetaTransaction(
                txMetadata.result,
              walletAddress,
              [
                  {
                    destination: attestations.address,
                    methodId: attestations.methodIds.request
                  }
                ]
            )

            expect(res.ok).toBe(false)
            if (res.ok === false) {
              expect(res.error.errorType).toBe(MetaTxValidationErrorTypes.InvalidChildMethod)
            }
          }
          })
      })

      describe('pointing to an allowed method', () => {
        it('returns ok!', async () => {
          const module = await buildModule({}, {})
          const walletService = module.get(WalletService)
          const contractKit = module.get(ContractKit)
          const walletAddress = Web3.utils.randomHex(20)

          const attestations = await contractKit.contracts.getAttestations()
          const wallet = await contractKit.contracts.getMetaTransactionWallet(walletAddress)
          const testTx = toRawTransaction(
            wallet.executeMetaTransaction(
              attestations.selectIssuers("0x0").txo,
              {v: 0, r: "0x0", s: "0x0"}
            ).txo
          )

          const txMetadata = await walletService.extractMetaTxData(testTx)
          expect(txMetadata.ok).toBe(true)

          if (txMetadata.ok === true) {
            const res = await walletService.isAllowedMetaTransaction(
                txMetadata.result,
                walletAddress,
                [
                  {
                    destination: attestations.address,
                    methodId: attestations.methodIds.request
                  }
                ]
            )

            expect(res.ok).toBe(false)
            if (res.ok === false) {
              expect(res.error.errorType).toBe(MetaTxValidationErrorTypes.InvalidChildMethod)
            }
          }
        })

        describe('pointing to an executeTransactions with not allowed sub-txs', () => {
          it('rejects', async () => {
            const module = await buildModule({}, {})
            const walletService = module.get(WalletService)
            const contractKit = module.get(ContractKit)
            const walletAddress = normalizeAddress(Web3.utils.randomHex(20))

            const attestations = await contractKit.contracts.getAttestations()
            const wallet = await contractKit.contracts.getMetaTransactionWallet(walletAddress)
            const testTx = toRawTransaction(
              wallet.executeMetaTransaction(
                wallet.executeTransactions([
                  attestations.selectIssuers("0x0").txo
                ]).txo,
                {v: 0, r: "0x0", s: "0x0"}
              ).txo
            )

            const txMetadata = await walletService.extractMetaTxData(testTx)
            expect(txMetadata.ok).toBe(true)

            if (txMetadata.ok === true) {
              const res = await walletService.isAllowedMetaTransaction(
                txMetadata.result,
                walletAddress,
                [
                  {
                    destination: attestations.address,
                    methodId: attestations.methodIds.request
                  }
                ]
              )

              expect(res.ok).toBe(false)
              if (res.ok === false) {
                expect(res.error.errorType).toBe(MetaTxValidationErrorTypes.InvalidChildMethod)
              }
            }
          })
        })

        describe('pointing to an executeTransactions with allowed sub-txs', () => {
          it('returns ok!', async () => {
            const module = await buildModule({}, {})
            const walletService = module.get(WalletService)
            const contractKit = module.get(ContractKit)
            const walletAddress = normalizeAddress(Web3.utils.randomHex(20))

            const attestations = await contractKit.contracts.getAttestations()
            const wallet = await contractKit.contracts.getMetaTransactionWallet(walletAddress)
            const testTx = toRawTransaction(
              wallet.executeMetaTransaction(
                wallet.executeTransactions([
                  attestations.selectIssuers("0x0").txo
                ]).txo,
                { v: 0, r: "0x0", s: "0x0" }
              ).txo
            )

            const txMetadata = await walletService.extractMetaTxData(testTx)
            expect(txMetadata.ok).toBe(true)

            if (txMetadata.ok === true) {
              const res = await walletService.isAllowedMetaTransaction(
                txMetadata.result,
                walletAddress,
                [
                  {
                    destination: attestations.address,
                    methodId: attestations.methodIds.selectIssuers
                  }
                ]
              )

              expect(res.ok).toBe(true)
            }
          })
        })
      })
    })
  })

  describe('#deployWallet', () => {
    const validImplementation = Web3.utils.randomHex(20)
    const invalidImplementation = Web3.utils.randomHex(20)
    const externalAccount = Web3.utils.randomHex(20)

    let module: TestingModule
    beforeEach(async () => {
      module = await buildModule({
        transactionTimeoutMs: 1000
      }, {
        contracts: {
          MetaTransactionWalletVersions: {
            [validImplementation]: "1.1.0.0"
          },
          MetaTransactionWalletDeployer: "0x0"
        }
      })
    })


    describe('with an invalid implementation', () => {
      it('returns an InvalidImplementation', async () => {
        const session = Session.of({})
        const walletSvc = module.get(WalletService)
        const deployRes = await walletSvc.deployWallet(session, invalidImplementation)

        expect(deployRes.ok).toBe(false)
        if (deployRes.ok === false) {
          expect(deployRes.error.errorType).toBe(WalletErrorType.InvalidImplementation)
        }
      })
    })

    describe('with a valid implementation', () => {
      describe('on the first run', () => {
        it('sends a transaction and updates the session', async () => {
          const session = Session.of({
            id: 'session-1',
            externalAccount
          })

          const walletSvc = module.get(WalletService)
          const sessionSvc = module.get(SessionService)
          const relayerSvc = module.get(RelayerProxyService)
          const txHash = Web3.utils.randomHex(32)

          const submitTxSpy = jest.spyOn(
            relayerSvc,
            'submitTransaction'
          ).mockResolvedValue({ payload: txHash, relayerAddress: '0x22' })

          const updateSessionSpy = jest.spyOn(
            sessionSvc,
            'update'
          ).mockResolvedValue(null)

          const deployRes = await walletSvc.deployWallet(session, validImplementation)
          expect(deployRes.ok).toBe(true)

          if (deployRes.ok === true) {
            expect(deployRes.result).toBe(txHash)
            expect(submitTxSpy).toHaveBeenCalled()
            expect(updateSessionSpy).toHaveBeenCalledWith(
              session.id,
              {
                meta: {
                  walletDeploy: expect.objectContaining({
                    txHash,
                    implementationAddress: validImplementation
                  })
                }
              }
            )
          }
        })
      })

      describe('on a subsequent run', () => {
        describe('before the deadline passed', () => {
          it('returns the same tx hash', async () => {
            const txHash = Web3.utils.randomHex(32)
            const session = Session.of({
              id: 'session-1',
              externalAccount,
              meta: {
                callCount: {},
                walletDeploy: {
                  txHash,
                  implementationAddress: validImplementation,
                  startedAt: Date.now() - 100
                }
              }
            })

            const walletSvc = module.get(WalletService)
            const deployRes = await walletSvc.deployWallet(session, validImplementation)
            const sessionSvc = module.get(SessionService)
            const relayerSvc = module.get(RelayerProxyService)

            const submitTxSpy = jest.spyOn(relayerSvc, 'submitTransaction')
            const updateSessionSpy = jest.spyOn(sessionSvc,'update')
            expect(deployRes.ok).toBe(true)

            if (deployRes.ok === true) {
              expect(deployRes.result).toBe(txHash)
              expect(submitTxSpy).not.toHaveBeenCalled()
              expect(updateSessionSpy).not.toHaveBeenCalled()
            }
          })
        })
      })

      describe('after the deadline has passed', () => {
        it('executes a new tx', async () => {
          const oldTxHash = Web3.utils.randomHex(32)
          const session = Session.of({
            id: 'session-1',
            externalAccount,
            meta: {
              callCount: {},
              walletDeploy: {
                txHash: oldTxHash,
                implementationAddress: validImplementation,
                startedAt: Date.now() - 5000
              }
            }
          })

          const walletSvc = module.get(WalletService)
          const sessionSvc = module.get(SessionService)
          const relayerSvc = module.get(RelayerProxyService)
          const txHash = Web3.utils.randomHex(32)

          const submitTxSpy = jest.spyOn(
            relayerSvc,
            'submitTransaction'
          ).mockResolvedValue({ payload: txHash, relayerAddress: '0x22' })

          const updateSessionSpy = jest.spyOn(
            sessionSvc,
            'update'
          ).mockResolvedValue(null)

          const deployRes = await walletSvc.deployWallet(session, validImplementation)
          expect(deployRes.ok).toBe(true)

          if (deployRes.ok === true) {
            expect(deployRes.result).toBe(txHash)
            expect(submitTxSpy).toHaveBeenCalled()
            expect(updateSessionSpy).toHaveBeenCalledWith(
              session.id,
              {
                meta: {
                  callCount: {},
                  walletDeploy: expect.objectContaining({
                    txHash,
                    implementationAddress: validImplementation
                  })
                }
              }
            )
          }
        })
      })
    })
  })

  describe('#getWallet', () => {
    const validImplementation = Web3.utils.randomHex(20)
    const externalAccount = Web3.utils.randomHex(20)

    let module: TestingModule
    beforeEach(async () => {
      module = await buildModule({
        transactionTimeoutMs: 1000
      }, {
        contracts: {
          MetaTransactionWalletVersions: {
            [validImplementation]: "1.1.0.0"
          },
          MetaTransactionWalletDeployer: "0x0"
        }
      })
    })

    describe('when no metadata is recorded on the session', () => {
      it('returns WalletNotDeployed', async () => {
        const session = Session.of({
          id: 'session-1',
          externalAccount
        })

        const walletSvc = module.get(WalletService)
        const walletRes = await walletSvc.getWallet(session, validImplementation)

        expect(walletRes.ok).toBe(false)
        if (walletRes.ok === false) {
          expect(walletRes.error.errorType).toBe(WalletErrorType.NotDeployed)
        }
      })
    })

    describe('with metadata pointing to a deploy tx', () => {
      const buildTx = (txHash: string, blockNumber: number | null) => ({
        hash: txHash,
        nonce: 10,
        blockNumber,
        blockHash: blockNumber === null ? null : Web3.utils.randomHex(64),
        transactionIndex: blockNumber == null ? null : 10,
        from: Web3.utils.randomHex(20),
        to: Web3.utils.randomHex(20),
        value: "0",
        input: "0x0",
        gasPrice: "0x0",
        gas: 0
      })

      describe('which is still pending', () => {
        it('returns WalletNotDeployed', async () => {
          const txHash = Web3.utils.randomHex(32)
          const session = Session.of({
            id: 'session-1',
            externalAccount,
            meta: {
              callCount: {},
              walletDeploy: {
                txHash,
                implementationAddress: validImplementation,
                startedAt: Date.now() - 100
              }
            }
          })

          const walletSvc = module.get(WalletService)
          const deployer = module.get(MetaTransactionWalletDeployerWrapper)
          const web3 = module.get(Web3)

          const tx = buildTx(txHash, null)
          const getTxSpy = jest.spyOn(web3.eth, 'getTransaction').mockResolvedValue(tx)

          const walletRes = await walletSvc.getWallet(session, validImplementation)
          expect(walletRes.ok).toBe(false)
          if (walletRes.ok === false) {
            expect(walletRes.error.errorType).toBe(WalletErrorType.NotDeployed)
          }
        })
      })

      describe('which is no longer pending', () => {
        it('returns the wallet address', async () => {
          const txHash = Web3.utils.randomHex(32)
          const walletAddress = Web3.utils.randomHex(20)
          const session = Session.of({
            id: 'session-1',
            externalAccount,
            meta: {
              callCount: {},
              walletDeploy: {
                txHash,
                implementationAddress: validImplementation,
                startedAt: Date.now() - 100
              }
            }
          })

          const walletSvc = module.get(WalletService)
          const deployer = module.get(MetaTransactionWalletDeployerWrapper)
          const web3 = module.get(Web3)

          const tx = buildTx(txHash, 2019)
          const getTxSpy = jest.spyOn(web3.eth, 'getTransaction').mockResolvedValue(tx)

          const getPastEventsSpy = jest.spyOn(deployer, 'getPastEvents').mockResolvedValue([
            {
              address: deployer.address,
              blockHash: tx.blockHash,
              blockNumber: tx.blockNumber,
              event: "0x1",
              logIndex: 10,
              transactionIndex: 10,
              transactionHash: txHash,
              returnValues: {
                owner: externalAccount,
                wallet: walletAddress
              }
            }
          ])

          const walletRes = await walletSvc.getWallet(session, validImplementation)

          expect(walletRes.ok).toBe(true)
          if (walletRes.ok === true) {
            expect(getTxSpy).toHaveBeenCalledWith(txHash)
            expect(getPastEventsSpy).toHaveBeenCalledWith(
              deployer.eventTypes.WalletDeployed,
              {
                fromBlock: tx.blockNumber,
                toBlock: tx.blockNumber
              }
            )
            expect(walletRes.result).toBe(walletAddress)
          }
        })
      })
    })
  })
})