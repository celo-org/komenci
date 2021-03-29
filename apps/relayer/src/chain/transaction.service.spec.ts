import { BlockchainService, NodeRPCError, TxPool } from '@app/blockchain/blockchain.service'
import { walletConfig, WalletConfig } from '@app/blockchain/config/wallet.config'
import { KomenciLoggerModule, KomenciLoggerService } from '@app/komenci-logger'
import { sleep } from '@celo/base'
import { Err, Ok } from '@celo/base/lib/result'
import { ContractKit } from '@celo/contractkit'
import { MetaTransactionWalletWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { Test, TestingModule } from '@nestjs/testing'
import { BalanceService } from 'apps/relayer/src/chain/balance.service'
import { appConfig, AppConfig } from 'apps/relayer/src/config/app.config'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { Transaction, TransactionReceipt } from 'web3-core'
import { TransactionService } from './transaction.service'

jest.mock('@app/blockchain/blockchain.service')
jest.mock('@celo/contractkit')
jest.mock('@app/komenci-logger/komenci-logger.service')
jest.mock('@celo/contractkit/lib/wrappers/MetaTransactionWallet')

describe('TransactionService', () => {
  const relayerAddress = Web3.utils.randomHex(20)
  // @ts-ignore
  const contractKit = new ContractKit()
  // @ts-ignore
  contractKit.web3 = {
    eth: {
      getTransaction: jest.fn(),
      getTransactionReceipt: jest.fn()
    }
  }
  // @ts-ignore
  contractKit.connection = {
    nonce: jest.fn()
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
        const getTransaction = jest.spyOn(contractKit.web3.eth, 'getTransaction')
        const nonce = jest.spyOn(contractKit.connection, 'nonce').mockResolvedValue(2)
        const txPromise = Promise.resolve(tx)
        getTransaction.mockReturnValue(txPromise)

        const rawTx = {
          destination: tx.to,
          data: tx.input,
          value: tx.value
        }

        const hash = await service.submitTransaction(rawTx)

        expect(nonce).toHaveBeenCalled()
        expect(sendTransaction).toHaveBeenCalledWith(expect.objectContaining({
          to: rawTx.destination,
          data: rawTx.data,
          value: rawTx.value,
          from: relayerAddress
        }))

        expect(watchTransaction).toHaveBeenCalledWith(tx.hash, {
          expireIn: 2000,
          gasPrice: "1000000000",
          nonce: 2
        })

        // Ensure the checkTransactions method is called
        jest.runOnlyPendingTimers()
        await txPromise
        expect(checkTransactions).toHaveBeenCalled()

        // Shouldn't remove it from the unwatch list until it's finalized
        expect(unwatchTransaction).not.toHaveBeenCalledWith(tx.hash)

        // Simulate being included in a block and ensure it's unwatched
        const completedTx = txFixture()
        completedTx.hash = tx.hash
        completedTx.blockHash = "notNull"
        const completedTxPromise = Promise.resolve(completedTx)
        getTransaction.mockReturnValue(completedTxPromise)

        const getTransactionReceipt = jest.spyOn(contractKit.web3.eth, 'getTransactionReceipt')
        const txReceiptPromise = Promise.resolve(txReceiptFixture())
        getTransactionReceipt.mockReturnValue(txReceiptPromise)

        const getTotalBalance = jest.spyOn(contractKit, 'getTotalBalance')
        const relayerBalancePromise = Promise.resolve(relayerBalanceFixture())
        getTotalBalance.mockReturnValue(relayerBalancePromise)

        jest.runOnlyPendingTimers()
        await completedTxPromise
        await txReceiptPromise
        await relayerBalancePromise
        await Promise.resolve()
        expect(unwatchTransaction).toHaveBeenCalledWith(tx.hash)
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
        const getTransaction = jest.spyOn(contractKit.web3.eth, 'getTransaction').mockReturnValue(txPromise)
        // @ts-ignore
        const deadLetter = jest.spyOn(service, 'deadLetter')
        // @ts-ignore
        const checkTransactions = jest.spyOn(service, 'checkTransactions')
        // @ts-ignore
        const finalizeTransaction = jest.spyOn(service, 'finalizeTransaction')
        // @ts-ignore
        const isExpired = jest.spyOn(service, 'isExpired').mockReturnValue(true)
        const nonce = jest.spyOn(contractKit.connection, 'nonce').mockResolvedValue(2)

        const rawTx = {
          destination: tx.to,
          data: tx.input,
          value: tx.value
        }

        const hash = await service.submitTransaction(rawTx)

        expect(nonce).toHaveBeenCalled()
        expect(sendTransaction).toHaveBeenCalledWith(expect.objectContaining({
          to: rawTx.destination,
          data: rawTx.data,
          value: rawTx.value,
          from: relayerAddress
        }))

        expect(unwatchTransaction).not.toHaveBeenCalled()

        jest.runOnlyPendingTimers()
        expect(checkTransactions).toHaveBeenCalled()
        expect(finalizeTransaction).not.toHaveBeenCalled()
        await txPromise
        await(await txResult).getHash()
        await(await deadLetterResult).getHash()
        await Promise.resolve()
        jest.runOnlyPendingTimers()
        await Promise.resolve()
        expect(deadLetter).toHaveBeenCalledWith(tx.hash)
        expect(unwatchTransaction).toHaveBeenCalledWith(tx.hash)
        expect(watchTransaction).toHaveBeenNthCalledWith(
          1,
          tx.hash, 
          {
            expireIn: 2000,
            gasPrice: "1000000000",
            nonce: 2
          }
        )
        expect(watchTransaction).toHaveBeenNthCalledWith(
          2,
          deadLetterTx.hash, 
          expect.objectContaining({
            expireIn: 4000,
            gasPrice: "2000000000",
            nonce: 2
          })
        )
        expect(watchTransaction.mock.calls.length).toBe(2)
      })
    })
  })
})
