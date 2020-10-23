import { BlockchainService, NodeRPCError, TxPool } from '@app/blockchain/blockchain.service'
import { walletConfig, WalletConfig } from '@app/blockchain/config/wallet.config'
import { Err, Ok } from '@celo/base/lib/result'
import { ContractKit } from '@celo/contractkit'
import { Test } from '@nestjs/testing'
import { appConfig, AppConfig } from 'apps/relayer/src/config/app.config'
import { LoggerModule } from 'nestjs-pino'
import Web3 from 'web3'
import { Transaction, TransactionReceipt } from 'web3-core'
import { TransactionService } from './transaction.service'

jest.mock('@app/blockchain/blockchain.service')
jest.mock('@celo/contractkit')

describe('TransactionService', () => {
  const relayerAddress = Web3.utils.randomHex(20)
  // @ts-ignore
  const blockchainService = new BlockchainService()
  // @ts-ignore
  const contractKit = new ContractKit()
  // @ts-ignore
  contractKit.web3 = {
    eth: {
      getTransaction: jest.fn()
    }
  }

  const setupService = async (
    testAppConfig: Partial<AppConfig>,
    testWalletConfig: Partial<WalletConfig>
  ): Promise<TransactionService>  => {
    const appConfigValue: Partial<AppConfig> = {
      networkConfig: {
        fullNodeUrl: '',
        odisPubKey: '',
        odisUrl: '',
      },
      ...testAppConfig
    }

    const walletConfigValue: Partial<WalletConfig> = {
      address: relayerAddress,
      ...testWalletConfig
    }

    const module = await Test.createTestingModule({
      imports: [
        LoggerModule.forRoot(),
      ],
      providers: [
        TransactionService,
        { provide: BlockchainService, useValue: blockchainService},
        { provide: ContractKit, useValue: contractKit },
        { provide: walletConfig.KEY, useValue: walletConfigValue },
        { provide: appConfig.KEY, useValue: appConfigValue }
      ]
    }).compile()

    return module.get<TransactionService>(TransactionService)
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
    const service = await setupService({}, {})
    expect(service).toBeDefined()
  })

  describe('#onModuleInit', () => {
    describe('when looking up transactions fails', () => {
      it('initializes with an empty set', async () => {
        const getTxPool = jest.spyOn(blockchainService, 'getPendingTxPool').mockResolvedValue(
          Err(new NodeRPCError(new Error("node-rpc-error")))
        )
        const service = await setupService({}, {})
        await service.onModuleInit()

        expect(getTxPool).toHaveBeenCalled()
        // @ts-ignore
        expect(service.watchedTransactions.size).toBe(0)
      })
    })

    describe('when looking up transactions works', () => {
      it('extracts pending transactions from response', async () => {
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
        const service = await setupService({}, {})
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
      service = await setupService({
        transactionTimeoutMs: 1000,
        transactionCheckIntervalMs: 500
      }, {})
      // @ts-ignore
      jest.spyOn(service, 'getPendingTransactionHashes').mockResolvedValue([])
      await service.onModuleInit()
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

        expect(watchTransaction).toHaveBeenCalledWith(tx.hash, result)
        // The receipt wait isn't waited on, it happens in the next tick
        await setTimeout(() => {
          expect(unwatchTransaction).toHaveBeenCalledWith(tx.hash)
        })
        jest.advanceTimersToNextTimer()
      })
    })

    describe('when the transaction times out', () => {
      it('gets dead lettered when it is expired', async () => {
        const tx = txFixture()
        const receipt = receiptFixture(tx)
        const result: any = {
          getHash: () => Promise.resolve(tx.hash),
          // Simulate timeout
          waitReceipt: () => new Promise(resolve => setTimeout(resolve, 10000))
        }
        const sendTransaction = jest.spyOn(contractKit, 'sendTransaction').mockResolvedValue(result)
        // @ts-ignore
        const watchTransaction = jest.spyOn(service, 'watchTransaction')
        // @ts-ignore
        const unwatchTransaction = jest.spyOn(service, 'unwatchTransaction')
        const getTransaction = jest.spyOn(contractKit.web3.eth, 'getTransaction').mockResolvedValue(tx)
        // @ts-ignore
        const deadLetter = jest.spyOn(service, 'deadLetter')
        // @ts-ignore
        const checkTransactions = jest.spyOn(service, 'checkTransactions')
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

        expect(watchTransaction).toHaveBeenCalledWith(tx.hash, result)
        expect(unwatchTransaction).not.toHaveBeenCalled()

        jest.advanceTimersByTime(600)

        expect(checkTransactions).toHaveBeenCalled()
        await setTimeout(() => {
          expect(deadLetter).toHaveBeenCalledWith(expect.objectContaining(tx))
          expect(unwatchTransaction).toHaveBeenCalledWith(tx.hash)
        })

      })
    })

  })
})