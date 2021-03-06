import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { Transaction, TransactionReceipt } from 'web3-core'

import { Err, Ok } from '@celo/base/lib/result'
import { ContractKit } from '@celo/contractkit'
import { MetaTransactionWalletWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { BlockchainService, NodeRPCError, TxPool } from '@komenci/blockchain/dist/blockchain.service'
import { walletConfig, WalletConfig } from '@komenci/blockchain/dist/config/wallet.config'
import { KomenciLoggerModule } from '@komenci/logger'
import { Test, TestingModule } from '@nestjs/testing'
import { BalanceService } from '../chain/balance.service'
import { appConfig, AppConfig } from '../config/app.config'
import { TransactionService } from './transaction.service'

jest.mock('@celo/contractkit')
jest.mock('@celo/contractkit/lib/wrappers/MetaTransactionWallet')
jest.mock('@komenci/blockchain/dist/blockchain.service')
jest.mock('@komenci/logger/dist/komenci-logger.service')

describe('TransactionService', () => {
  const relayerAddress = Web3.utils.randomHex(20)
  // @ts-ignore
  const contractKit = new ContractKit()
  // @ts-ignore
  contractKit.web3 = {
    BatchRequest: jest.fn(() => ({
      add: jest.fn(),
      execute: jest.fn()
    })),
    eth: {
      getTransaction: {
        request: jest.fn(),
      },
      getTransactionReceipt: {
        request: jest.fn()
      }
    }
  }
  // @ts-ignore
  contractKit.connection = {
    nonce:  () => Promise.resolve(2)
  }
  

  const buildModule = async (
    testAppConfig: Partial<AppConfig>,
    testWalletConfig: Partial<WalletConfig>
  ): Promise<TestingModule>  => {
    const appConfigValue: Partial<AppConfig> = {
      gasPriceFallback: "1000000000",
      ...testAppConfig
    }

    const walletConfigValue: Partial<WalletConfig> = {
      address: relayerAddress,
      ...testWalletConfig
    }

    return Test.createTestingModule({
      imports: [
        KomenciLoggerModule.forRoot(),
      ],
      providers: [
        TransactionService,
        BlockchainService,
        BalanceService,
        { provide: ContractKit, useValue: contractKit },
        { provide: walletConfig.KEY, useValue: walletConfigValue },
        { provide: appConfig.KEY, useValue: appConfigValue },
        MetaTransactionWalletWrapper
      ]
    }).compile()
  }

  const txFixture = (params?: Partial<Transaction>): Transaction => {
    return {
      hash: Web3.utils.randomHex(40),
      nonce: 1,
      blockHash: null,
      blockNumber: null,
      transactionIndex: null,
      from: Web3.utils.randomHex(20),
      to: Web3.utils.randomHex(20),
      input: "0x0",
      gasPrice: Web3.utils.randomHex(4),
      gas: 100000,
      value: "1000",
      ...(params || {}),
    }
  }

  const txReceiptFixture = (): TransactionReceipt => {
    return {
      gasUsed: 10,
      cumulativeGasUsed: 10,
      blockNumber: null,
      from: Web3.utils.randomHex(20),
      to: Web3.utils.randomHex(20),
      logs: [],
      logsBloom: '',
      status: true,
      transactionHash: null,
      transactionIndex: null,
      blockHash: null,
    }
  }

  const relayerBalanceFixture = () => {
    return {
      CELO: new BigNumber(10),
      cUSD: new BigNumber(100),
      lockedCELO: new BigNumber(0),
      pending: new BigNumber(0),
    }
  }

  const receiptFixture = (tx: Transaction, params?: Partial<TransactionReceipt>): TransactionReceipt => {
    return {
      status: true,
      transactionHash: tx.hash,
      transactionIndex: tx.transactionIndex,
      blockHash: tx.blockHash,
      blockNumber: tx.blockNumber,
      from: tx.from,
      to: tx.to,
      cumulativeGasUsed: 100000,
      gasUsed: 100000,
      logs: [],
      logsBloom: ""
    }
  }

  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllTimers()
  })

  it('should be defined', async () => {
    const module = await buildModule({}, {})
    const service = module.get(TransactionService)
    expect(service).toBeDefined()
  })

  describe('#onModuleInit', () => {
    describe('when looking up transactions fails', () => {
      it('initializes with an empty set', async () => {
        const module = await buildModule({}, {})
        const blockchainService = module.get(BlockchainService)
        const service = module.get(TransactionService)

        const getTxPool = jest.spyOn(blockchainService, 'getPendingTxPool').mockResolvedValue(
          Err(new NodeRPCError(new Error("node-rpc-error")))
        )

        await service.onModuleInit()

        expect(getTxPool).toHaveBeenCalled()
        // @ts-ignore
        expect(service.watchedTransactions.size).toBe(0)
      })
    })

    describe('when looking up transactions works', () => {
      it('extracts pending transactions from response', async () => {
        const module = await buildModule({}, {})
        const blockchainService = module.get(BlockchainService)
        const service = module.get(TransactionService)

        const tx = txFixture({
          from: relayerAddress
        })
        const txPoolResponse: TxPool = {
          pending: {
            [Web3.utils.toChecksumAddress(relayerAddress)]: {
              1: tx
            }
          },
          queued: {}
        }
        const getTxPool = jest.spyOn(blockchainService, 'getPendingTxPool').mockResolvedValue(
          Ok(txPoolResponse)
        )
        await service.onModuleInit()

        expect(getTxPool).toHaveBeenCalled()
        // @ts-ignore
        expect(service.watchedTransactions.size).toBe(1)
        // @ts-ignore
        expect(service.watchedTransactions.has(tx.hash)).toBeTruthy()
      })
    })
  })

  describe('#submitTransaction', () => {
    let service: TransactionService

    beforeEach(async () => {
      const module = await buildModule({
        transactionTimeoutMs: 2000,
        transactionCheckIntervalMs: 500
      }, {})

      service = module.get(TransactionService)
      const balanceService = module.get(BalanceService)

      // @ts-ignore
      jest.spyOn(service, 'getPendingTransactions').mockResolvedValue([])
      jest.spyOn(balanceService, 'logBalance').mockResolvedValue(null)
      await service.onModuleInit()
    })

    afterEach(() => {
      service.onModuleDestroy()
    })

    describe('when the transaction result resolves', () => {
      it('submits the transaction to the chain, watched then unwatches', async () => {
        const tx = txFixture()
        const receipt = receiptFixture(tx)
        const result: any = {
          getHash: () => Promise.resolve(tx.hash),
          waitReceipt: () => Promise.resolve(receipt)
        }
        const sendTransaction = jest.spyOn(contractKit, 'sendTransaction').mockResolvedValue(result)
        // @ts-ignore
        const watchTransaction = jest.spyOn(service, 'watchTransaction')
        // @ts-ignore
        const unwatchTransaction = jest.spyOn(service, 'unwatchTransaction')
        // @ts-ignore
        const checkTransactions = jest.spyOn(service, 'checkTransactions')
        // Simulate pending tx
        const getTransaction = jest.spyOn(contractKit.web3.eth.getTransaction, 'request')
        getTransaction.mockImplementation((...args: any) => {
          const callback = args[args.length - 1]
          callback(null, tx)
        })

        const rawTx = {
          destination: tx.to,
          data: tx.input,
          value: tx.value
        }

        const hash = await service.submitTransaction(rawTx)

        expect(sendTransaction).toHaveBeenCalledWith(expect.objectContaining({
          to: rawTx.destination,
          data: rawTx.data,
          value: rawTx.value,
          from: relayerAddress
        }))

        expect(watchTransaction).toHaveBeenCalledWith(tx.hash, {
          expireIn: 2000,
          gasPrice: new BigNumber("1000000000"),
          nonce: 2,
          traceContext: undefined
        })

        // Ensure the checkTransactions method is called
        jest.runOnlyPendingTimers()
        expect(checkTransactions).toHaveBeenCalled()

        // Shouldn't remove it from the unwatch list until it's finalized
        expect(unwatchTransaction).not.toHaveBeenCalledWith(expect.objectContaining({
          hash: tx.hash
        }))

        // Simulate being included in a block and ensure it's unwatched
        const completedTx = txFixture()
        completedTx.hash = tx.hash
        completedTx.blockHash = "notNull"
        const completedTxPromise = Promise.resolve(completedTx)
        getTransaction.mockImplementation((...args: any) => {
          const callback = args[args.length - 1]
          callback(null, completedTx)
        })

        const getTransactionReceipt = jest.spyOn(contractKit.web3.eth.getTransactionReceipt, 'request')
        const txReceipt = txReceiptFixture()
        getTransactionReceipt.mockImplementation((...args: any) => {
          const callback = args[args.length - 1]
          callback(null, txReceipt)
        })

        const getTotalBalance = jest.spyOn(contractKit, 'getTotalBalance')
        const relayerBalancePromise = Promise.resolve(relayerBalanceFixture())
        getTotalBalance.mockReturnValue(relayerBalancePromise)

        await completedTxPromise
        await relayerBalancePromise
        // @ts-ignore
        await service.checkTransactions()
        // @ts-ignore
        await service.checkTransactions()
        expect(unwatchTransaction).toHaveBeenCalledWith(tx.hash)
        expect(unwatchTransaction).toHaveBeenCalledTimes(1)
      })
    })

    describe('when the transaction times out', () => {
      it('gets dead lettered when it is expired', async () => {
        const tx = txFixture()
        const receipt = receiptFixture(tx)

        const deadLetterTx = txFixture()
        const deadLetterReceipt = receiptFixture(deadLetterTx)

        const txResult = Promise.resolve({
          getHash: () => Promise.resolve(tx.hash),
          waitReceipt: () => Promise.resolve(receipt)
        })

        const deadLetterResult = Promise.resolve({
          getHash: () => Promise.resolve(deadLetterTx.hash),
          waitReceipt: () => Promise.resolve(deadLetterReceipt)
        })

        const sendTransaction = jest.spyOn(contractKit, 'sendTransaction')
          .mockReturnValueOnce(txResult as any)
          .mockResolvedValueOnce(deadLetterResult as any)
        // @ts-ignore
        const watchTransaction = jest.spyOn(service, 'watchTransaction')
        // @ts-ignore
        const unwatchTransaction = jest.spyOn(service, 'unwatchTransaction')
        const txPromise = Promise.resolve(tx)
        const getTransaction = jest.spyOn(contractKit.web3.eth.getTransaction, 'request')
        getTransaction.mockImplementation((...args: any) => {
          const callback = args[args.length - 1]
          callback(null, tx)
        })
        // @ts-ignore
        const deadLetter = jest.spyOn(service, 'deadLetter')
        // @ts-ignore
        const checkTransactions = jest.spyOn(service, 'checkTransactions')
        // @ts-ignore
        const finalizeTransaction = jest.spyOn(service, 'finalizeTransaction')
        // @ts-ignore
        const isExpired = jest.spyOn(service, 'isExpired').mockReturnValue(true)

        const rawTx = {
          destination: tx.to,
          data: tx.input,
          value: tx.value
        }

        const hash = await service.submitTransaction(rawTx)

        expect(sendTransaction).toHaveBeenCalledWith(expect.objectContaining({
          to: rawTx.destination,
          data: rawTx.data,
          value: rawTx.value,
          from: relayerAddress
        }))

        expect(unwatchTransaction).not.toHaveBeenCalled()

        // @ts-ignore
        await service.checkTransactions()
        expect(finalizeTransaction).not.toHaveBeenCalled()
        expect(deadLetter).toHaveBeenCalledWith(expect.objectContaining({hash: tx.hash}), 'Expired')
        expect(unwatchTransaction).toHaveBeenCalledWith(tx.hash)
        expect(watchTransaction).toHaveBeenNthCalledWith(
          1,
          tx.hash, 
          expect.objectContaining({
            expireIn: 2000,
            gasPrice: new BigNumber("1000000000"),
            nonce: 2,
            traceContext: undefined
          })
        )
        expect(watchTransaction).toHaveBeenNthCalledWith(
          2,
          deadLetterTx.hash, 
          expect.objectContaining({
            expireIn: 4000,
            gasPrice: new BigNumber("1400000000"),
            nonce: 2,
            traceContext: undefined
          })
        )
        expect(watchTransaction.mock.calls.length).toBe(2)
      })
    })

    describe('when the transaction has gas too low', () => {
      it('is deadlettered', async () => {
        const tx = txFixture()
        const receipt = receiptFixture(tx)

        const deadLetterTx = txFixture()
        const deadLetterReceipt = receiptFixture(deadLetterTx)

        const txResult = Promise.resolve({
          getHash: () => Promise.resolve(tx.hash),
          waitReceipt: () => Promise.resolve(receipt)
        })

        const deadLetterResult = Promise.resolve({
          getHash: () => Promise.resolve(deadLetterTx.hash),
          waitReceipt: () => Promise.resolve(deadLetterReceipt)
        })

        const sendTransaction = jest.spyOn(contractKit, 'sendTransaction')
          .mockReturnValueOnce(txResult as any)
          .mockResolvedValueOnce(deadLetterResult as any)
        // @ts-ignore
        const watchTransaction = jest.spyOn(service, 'watchTransaction')
        // @ts-ignore
        const unwatchTransaction = jest.spyOn(service, 'unwatchTransaction')
        const txPromise = Promise.resolve(tx)
        const getTransaction = jest.spyOn(contractKit.web3.eth.getTransaction, 'request')
        getTransaction.mockImplementation((...args: any) => {
          const callback = args[args.length - 1]
          callback(null, tx)
        })
        // @ts-ignore
        const deadLetter = jest.spyOn(service, 'deadLetter')
        // @ts-ignore
        const checkTransactions = jest.spyOn(service, 'checkTransactions')
        // @ts-ignore
        const finalizeTransaction = jest.spyOn(service, 'finalizeTransaction')
        // @ts-ignore
        const isExpired = jest.spyOn(service, 'isExpired').mockReturnValue(false)
        // @ts-ignore
        const hasGasTooLow = jest.spyOn(service, 'hasGasTooLow').mockReturnValue(true)

        const rawTx = {
          destination: tx.to,
          data: tx.input,
          value: tx.value
        }

        const hash = await service.submitTransaction(rawTx)

        expect(sendTransaction).toHaveBeenCalledWith(expect.objectContaining({
          to: rawTx.destination,
          data: rawTx.data,
          value: rawTx.value,
          from: relayerAddress
        }))

        expect(unwatchTransaction).not.toHaveBeenCalled()

        // @ts-ignore
        await service.checkTransactions()
        expect(finalizeTransaction).not.toHaveBeenCalled()
        expect(deadLetter).toHaveBeenCalledWith(expect.objectContaining({hash: tx.hash}), 'GasTooLow')
        expect(unwatchTransaction).toHaveBeenCalledWith(tx.hash)
        expect(watchTransaction).toHaveBeenNthCalledWith(
          1,
          tx.hash, 
          expect.objectContaining({
            expireIn: 2000,
            gasPrice: new BigNumber("1000000000"),
            nonce: 2,
            traceContext: undefined
          })
        )
        expect(watchTransaction).toHaveBeenNthCalledWith(
          2,
          deadLetterTx.hash, 
          expect.objectContaining({
            expireIn: 4000,
            gasPrice: new BigNumber("1400000000"),
            nonce: 2,
            traceContext: undefined
          })
        )
        expect(watchTransaction.mock.calls.length).toBe(2)
      })
    })
  })
})
