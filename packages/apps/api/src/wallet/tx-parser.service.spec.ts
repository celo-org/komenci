import { CeloTransactionObject } from '@celo/connect'
import { CeloContract, ContractKit } from '@celo/contractkit'
import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts'
import { AttestationsWrapper } from '@celo/contractkit/lib/wrappers/Attestations'
import { Address, normalizeAddress, trimLeading0x } from '@celo/base'
import { BlockchainModule } from '@komenci/blockchain'
import { WEB3_PROVIDER } from '@komenci/blockchain/dist/blockchain.providers'
import { NodeProviderType } from '@komenci/blockchain/dist/config/node.config'
import { normalizeMethodId } from '@komenci/core'
import { buildMockWeb3Provider } from '@komenci/core'
import { TxParseErrorTypes } from '../wallet/errors'
import { MethodFilter } from '../wallet/method-filter'
import { TxParserService } from '../wallet/tx-parser.service'
import {
  MetaTransactionWalletWrapper,
  RawTransaction,
  toRawTransaction,
  TransactionInput,
} from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper'
import { Test, TestingModule } from '@nestjs/testing'
import Web3 from 'web3'

describe('TxParserService', () => {
  let module: TestingModule
  let service: TxParserService

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        BlockchainModule.forRootAsync({
          useFactory: () => {
            return {
              node: { providerType: NodeProviderType.HTTP, url: "not-a-node" }
            }
          }
        }),
      ],
      providers: [ TxParserService ]
    }).overrideProvider(WEB3_PROVIDER).useValue(
      buildMockWeb3Provider(() => null)
    ).compile()
    service = module.get(TxParserService)
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('#onModuleInit', () => {
    it('should be called on init', async () => {
      const onModuleInitSpy = jest.spyOn(service, 'onModuleInit')
      await module.init()
      expect(onModuleInitSpy).toHaveBeenCalled()
    })

    it('should set default method filter', async () => {
      await module.init()
      expect(service.defaultFilter).not.toBeUndefined()
    })
  })

  describe.only('#parse', () => {
    beforeEach(async () => module.init())
    const addresses: Address[] = [0,0,0,0,0].map(() => Web3.utils.randomHex(20))
    const metaTxWallet = addresses[0]
    const otherMetaTxWallet = addresses[1]

    const subjectRaw = async (rawTx: RawTransaction, filterOverride?: MethodFilter) => {
      return service.parse(rawTx, metaTxWallet, filterOverride)
    }

    const subject = async (tx: CeloTransactionObject<any>, filterOverride?: MethodFilter) => {
      return subjectRaw(toRawTransaction(tx.txo), filterOverride)
    }

    const normalizedTx = (tx: TransactionInput<any>): RawTransaction => {
      const rawTx = toRawTransaction(tx)
      return {
        destination: normalizeAddress(rawTx.destination),
        data: trimLeading0x(rawTx.data),
        value: rawTx.value
      }
    }

    const mockSig = {v: 0, r:"0x0", s:"0x0"}
    let wallet: MetaTransactionWalletWrapper
    let otherWallet: MetaTransactionWalletWrapper
    let attestations: AttestationsWrapper
    let accounts: AccountsWrapper
    let cUSD: StableTokenWrapper

    beforeEach(async () => {
      const contractkit = module.get(ContractKit)
      wallet = await contractkit.contracts.getMetaTransactionWallet(metaTxWallet)
      otherWallet = await contractkit.contracts.getMetaTransactionWallet(otherMetaTxWallet)
      attestations = await contractkit.contracts.getAttestations()
      accounts = await contractkit.contracts.getAccounts()
      cUSD = await contractkit.contracts.getStableToken()
    })

    describe('with an invalid root transaction', () => {
      it('returns an InvalidRootTransaction error', async () => {
        const res = await subject(cUSD.transfer(addresses[2], "1000"))
        expect(res.ok).toBe(false)
        if (res.ok === false) {
          expect(res.error.errorType).toBe(TxParseErrorTypes.InvalidRootTransaction)
        }
      })
    })

    describe('with an invalid child transaction', () => {
      it('returns an TransactionNotAllowed error', async () => {
        const childTx = accounts.createAccount().txo
        const res = await subject(await wallet.executeMetaTransaction(childTx, mockSig))
        expect(res.ok).toBe(false)

        if (res.ok === false) {
          expect(res.error.errorType).toBe(TxParseErrorTypes.TransactionNotAllowed)
          if (res.error.errorType === TxParseErrorTypes.TransactionNotAllowed) {
            expect(res.error.tx).toMatchObject(normalizedTx(childTx))
          }
        }
      })
    })

    describe('with a valid transaction', () => {
      it('returns the child transaction', async () => {
        const childTx = cUSD.approve(addresses[2], "1000").txo

        const res = await subject(await wallet.executeMetaTransaction(childTx, mockSig))
        expect(res.ok).toBe(true)

        if (res.ok === true) {
          const txs = res.result
          expect(txs[0]).toMatchObject({
            contractName: CeloContract.StableToken,
            methodId: normalizeMethodId(cUSD.methodIds.approve),
            methodName: "approve",
            raw: normalizedTx(childTx)
          })
        }
      })
    })

    describe('with a batched transaction', () => {
      describe('containing an invalid transaction', () => {
        it('returns an TransactionNotAllowed error', async () => {
          const childTx0 = cUSD.approve(addresses[2], "1000").txo
          const childTx1 = accounts.createAccount().txo
          const batchTx = wallet.executeTransactions([childTx0, childTx1]).txo

          const res = await subject(await wallet.executeMetaTransaction(batchTx, mockSig))
          expect(res.ok).toBe(false)

          if (res.ok === false) {
            expect(res.error.errorType).toBe(TxParseErrorTypes.TransactionNotAllowed)
            if (res.error.errorType === TxParseErrorTypes.TransactionNotAllowed) {
              expect(res.error.tx).toMatchObject(normalizedTx(childTx1))
            }
          }
        })
      })

      describe('with only valid transactions', () => {
        it('returns an TransactionNotAllowed error', async () => {
          const childTx0 = cUSD.approve(addresses[2], "1000").txo
          const childTx1 = cUSD.transfer(addresses[3], "1000").txo
          const batchTx = wallet.executeTransactions([childTx0, childTx1]).txo

          const res = await subject(await wallet.executeMetaTransaction(batchTx, mockSig))
          expect(res.ok).toBe(true)

          if (res.ok === true) {
            const txs = res.result
            expect(txs[0]).toMatchObject({
              contractName: CeloContract.StableToken,
              methodId: normalizeMethodId(cUSD.methodIds.approve),
              methodName: "approve",
              raw: normalizedTx(childTx0)
            })
            expect(txs[1]).toMatchObject({
              contractName: CeloContract.StableToken,
              methodId: normalizeMethodId(cUSD.methodIds.transfer),
              methodName: "transfer",
              raw: normalizedTx(childTx1)
            })
          }
        })
      })
    })

    describe('with manually specified allowance', () => {
      describe('with an invalid transaction which is valid in defaults', () => {
        it('returns an TransactionNotAllowed error', async () => {
          const childTx = cUSD.approve(addresses[2], "1000").txo

          const res = await subject(
            await wallet.executeMetaTransaction(childTx, mockSig),
            new MethodFilter().addContract(
              CeloContract.StableToken,
              cUSD,
              ["transfer"]
            )
          )

          expect(res.ok).toBe(false)
          if (res.ok === false) {
            expect(res.error.errorType).toBe(TxParseErrorTypes.TransactionNotAllowed)
            if (res.error.errorType === TxParseErrorTypes.TransactionNotAllowed) {
              expect(res.error.tx).toMatchObject(normalizedTx(childTx))
            }
          }
        })
      })

      describe('with an invalid transaction which is valid in defaults', () => {
        it('returns an TransactionNotAllowed error', async () => {
          const childTx = cUSD.approve(addresses[2], "1000").txo
          const batchTx = wallet.executeTransactions([childTx]).txo

          const res = await subject(
            await wallet.executeMetaTransaction(childTx, mockSig),
            new MethodFilter().addContract(
              CeloContract.StableToken,
              cUSD,
              ["transfer"]
            )
          )

          expect(res.ok).toBe(false)
          if (res.ok === false) {
            expect(res.error.errorType).toBe(TxParseErrorTypes.TransactionNotAllowed)
            if (res.error.errorType === TxParseErrorTypes.TransactionNotAllowed) {
              expect(res.error.tx).toMatchObject(normalizedTx(childTx))
            }
          }
        })
      })
    })
  })
})