import { BlockchainModule, ContractsModule } from '@app/blockchain'
import { WEB3_PROVIDER } from '@app/blockchain/blockchain.providers'
import { NodeProviderType } from '@app/blockchain/config/node.config'
import { RequestAttestationsDto } from '@app/onboarding/dto/RequestAttestationsDto'
import { Session } from '@app/onboarding/session/session.entity'
import { SubsidyService } from '@app/onboarding/subsidy/subsidy.service'
import { buildMockWeb3Provider } from '@app/onboarding/utils/testing/mock-web3-provider'
import { TxParserService } from '@app/onboarding/wallet/tx-parser.service'
import { WalletService } from '@app/onboarding/wallet/wallet.service'
import { Err, Ok, Result, RootError, Signature } from '@celo/base'
import { ContractKit } from '@celo/contractkit'
import { AttestationsWrapper } from '@celo/contractkit/lib/wrappers/Attestations'
import { RawTransaction, toRawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper'
import { InvalidBytecode } from '@celo/komencikit/lib/errors'
import { Test, TestingModule } from '@nestjs/testing'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { InvalidWallet, TxParseErrorTypes, WalletErrorType } from '../wallet/errors'

jest.mock('@app/onboarding/wallet/wallet.service')

describe('SubsidyService', () => {
  let testingModule: TestingModule
  let service: SubsidyService
  let contractKit: ContractKit
  let attestations: AttestationsWrapper
  let stableToken: StableTokenWrapper
  let walletService: WalletService

  beforeEach(async () => {
    testingModule = await Test.createTestingModule({
      imports: [
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
      ],
      providers: [
        TxParserService,
        WalletService,
        SubsidyService,
      ]
    }).overrideProvider(WEB3_PROVIDER).useValue(
      buildMockWeb3Provider(() => null)
    ).compile()

    contractKit = testingModule.get(ContractKit)
    attestations = await contractKit.contracts.getAttestations()
    stableToken = await contractKit.contracts.getStableToken()
    walletService = testingModule.get(WalletService)
    service = testingModule.get(SubsidyService)

    // @ts-ignore
    service.contractKit = contractKit
    // @ts-ignore
    service.walletService = walletService
    // @ts-ignore
    service.txParserService = testingModule.get(TxParserService)
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const walletAddress = Web3.utils.randomHex(20)
  const identifier = Web3.utils.randomHex(10)
  const attestationsRequested = 3

  let input: RequestAttestationsDto
  let requestMetaTx: RawTransaction
  let approveMetaTx: RawTransaction
  let otherMetaTx: RawTransaction
  let otherTx: RawTransaction

  beforeEach(async () => {
    const wallet = await contractKit.contracts.getMetaTransactionWallet(walletAddress)
    const requestTx = await attestations.request(identifier, attestationsRequested)
    const approveTx = stableToken.approve(attestations.address, 10)
    const transferTx = stableToken.transfer(attestations.address, 10)
    const sig: Signature = {v: 0, r: "0x0", s: "0x0"}

    requestMetaTx = toRawTransaction(wallet.executeMetaTransaction(requestTx.txo, sig).txo)
    approveMetaTx = toRawTransaction(wallet.executeMetaTransaction( approveTx.txo, sig).txo)
    otherMetaTx = toRawTransaction(wallet.executeMetaTransaction(transferTx.txo, sig).txo)
    otherTx = toRawTransaction(transferTx.txo)
  })

  describe('#isValid', () => {
    const session = new Session()

    function expectError<
      TResult,
      TError extends RootError<any>
    >(result: Result<TResult, TError>, type: any) {
      expect(result.ok).toBe(false)
      if (result.ok === false) {
        expect(result.error.errorType).toBe(type)
      }
    }

    function expectSuccess<
      TResult,
      TError extends RootError<any>
    >(result: Result<TResult, TError>) {
      expect(result.ok).toBe(true)
    }

    describe('with an invalid wallet', () => {
      beforeEach(() => {
        const err = new InvalidWallet(new InvalidBytecode(walletAddress))
        jest.spyOn(walletService, 'isValidWallet').mockReturnValue(Promise.resolve(Err(err)))
        input = {
          identifier,
          attestationsRequested,
          walletAddress,
          requestTx: requestMetaTx,
        }
      })

      it('returns an InvalidWallet error', async () => {
        expectError(
          await service.isValid(input, session),
          WalletErrorType.InvalidWallet
        )
      })
    })

    describe('with a valid wallet', () => {
      beforeEach(() => {
        jest.spyOn(walletService, 'isValidWallet').mockReturnValue(Promise.resolve(Ok(true)))
      })

      describe('with only requestTx', () => {
        describe('which is invalid', () => {
          beforeEach(() => {
            input = {
              identifier,
              attestationsRequested,
              walletAddress,
              requestTx: otherMetaTx,
            }
          })

          it('returns an TransactionNotAllowed error', async () => {
            expectError(
              await service.isValid(input, session),
              TxParseErrorTypes.TransactionNotAllowed
            )
          })
        })

        describe('which is valid', () => {
          beforeEach(() => {
            input = {
              identifier,
              attestationsRequested,
              walletAddress,
              requestTx: requestMetaTx,
            }
          })

          it('is true', async () => {
            expectSuccess(await service.isValid(input, session))
          })
        })
      })

      describe('with both requestTx and approveTx', () => {
        describe('and both valid', () => {
          beforeEach(() => {
            input = {
              identifier,
              attestationsRequested,
              walletAddress,
              requestTx: requestMetaTx,
              approveTx: approveMetaTx
            }
          })

          it('is true', async () => {
            expectSuccess(await service.isValid(input, session))
          })
        })

        describe('but both are invalid', () => {
          beforeEach(() => {
            input = {
              identifier,
              attestationsRequested,
              walletAddress,
              requestTx: otherMetaTx,
              approveTx: otherMetaTx,
            }
          })

          it('returns an TransactionNotAllowed error', async () => {
            expectError(
              await service.isValid(input, session),
              TxParseErrorTypes.TransactionNotAllowed
            )
          })
        })

        describe('but approveTx invalid', () => {
          beforeEach(() => {
            input = {
              identifier,
              attestationsRequested,
              walletAddress,
              requestTx: requestMetaTx,
              approveTx: otherMetaTx,
            }
          })

          it('returns an TransactionNotAllowed error', async () => {
            expectError(
              await service.isValid(input, session),
              TxParseErrorTypes.TransactionNotAllowed
            )
          })
        })

        describe('but requestTx invalid', () => {
          beforeEach(() => {
            input = {
              identifier,
              attestationsRequested,
              walletAddress,
              requestTx: otherMetaTx,
              approveTx: approveMetaTx
            }
          })

          it('returns an TransactionNotAllowed error', async () => {
            expectError(
              await service.isValid(input, session),
              TxParseErrorTypes.TransactionNotAllowed
            )
          })
        })
      })
    })
  })

  describe('#buildTransactionBatch', () => {
    let getAttestationFee: jest.SpyInstance
    let transfer : jest.SpyInstance

    beforeEach(() => {
      getAttestationFee = jest.spyOn(
        attestations,
        'getAttestationFeeRequired'
      ).mockImplementation((count) => {
        return Promise.resolve(new BigNumber(100).times(count))
      })

      transfer = jest.spyOn(
        stableToken,
        'transfer'
      ).mockImplementation((to, amount): any => {
        return {
          txo: {
            destination: 'cUSD',
            data: { to, amount },
            value: "0"
          }
        }
      })
    })


    describe("without approveTx", () => {
      beforeEach(() => {
        input = {
          identifier,
          attestationsRequested,
          walletAddress,
          requestTx: requestMetaTx,
        }
      })

      it('outputs 2 transactions', async () => {
        const batch = await service.buildTransactionBatch(input)
        expect(batch.length).toEqual(2)

        expect(transfer).toHaveBeenCalledWith(input.walletAddress, new BigNumber(100 * input.attestationsRequested).toFixed())
        expect(getAttestationFee).toHaveBeenCalledWith(input.attestationsRequested)
      })
    })

    describe("with approveTx", () => {
      beforeEach(() => {
        input = {
          identifier,
          attestationsRequested,
          walletAddress,
          requestTx: requestMetaTx,
          approveTx: approveMetaTx,
        }
      })

      it('outputs 3 transactions', async () => {
        const batch = await service.buildTransactionBatch(input)
        expect(batch.length).toEqual(3)

        expect(transfer).toHaveBeenCalledWith(input.walletAddress, new BigNumber(100 * input.attestationsRequested).toFixed())
        expect(getAttestationFee).toHaveBeenCalledWith(input.attestationsRequested)
      })
    })
  })
})