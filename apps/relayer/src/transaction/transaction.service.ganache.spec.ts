import { BlockchainService, TxPool } from '@app/blockchain/blockchain.service'
import { walletConfig, WalletConfig } from '@app/blockchain/config/wallet.config'
import { Err, ErrorResult, Ok, OkResult, Result } from '@celo/base/lib/result'
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit/lib/kit'
import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts'
import { Test } from '@nestjs/testing'
import { appConfig, AppConfig } from 'apps/relayer/src/config/app.config' 
import { LoggerModule } from 'nestjs-pino'
import Web3 from 'web3'
import { Transaction } from 'web3-core'
import { TransactionService } from './transaction.service'

import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'

testWithGanache('TransactionService', (web3) => {
  let accounts: string[] = []
  let contract: AccountsWrapper

  // @ts-ignore
  const contractKit = newKitFromWeb3(web3)
  
  // @ts-ignore
  const blockchainService = new BlockchainService(contractKit.web3.eth.currentProvider)
  const relayerAddress = contractKit.defaultAccount
  
  const setupService = async (
    testAppConfig: Partial<AppConfig>,
    testWalletConfig: Partial<WalletConfig>
  ): Promise<TransactionService>  => {
    const appConfigValue: Partial<AppConfig> = {
      ...testAppConfig
    }

    const walletConfigValue: Partial<WalletConfig> = {
      address: relayerAddress,
      ...testWalletConfig
    }

    const module = await Test.createTestingModule({
      imports: [
        LoggerModule.forRoot()
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

  const txPoolResponse: TxPool = {
    pending: {
      [Web3.utils.toChecksumAddress(relayerAddress)]: {
        1: txFixture({
          from: relayerAddress
        })
      }
    },
    queued: {}
  }

  const getTxPool = jest.spyOn(blockchainService, 'getPendingTxPool').mockResolvedValue(
    Ok(txPoolResponse)
  )

  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllTimers()
  })

  beforeAll(async () => {
    accounts = await web3.eth.getAccounts()
    contractKit.defaultAccount = accounts[0]
    contract = await contractKit.contracts.getAccounts()
  })

  it('should be defined', async () => {
    const service = await setupService({}, {})
    expect(service).toBeDefined()
  })

  describe('#contractKit', () => {
    describe('when the transaction is confirmed', () => {
      it('submits the transaction to the chain, checks hash', async () => {
        const tx = txFixture()
        await contract.createAccount().send({ from: contractKit.defaultAccount })
        const isAccount = await contract.isAccount(contractKit.defaultAccount)
        expect(isAccount).toBeTruthy()

        const rawTx = {
          destination: tx.to,
          data: tx.input,
          value: tx.value
        }

        const result = await contractKit.sendTransaction({
          to: rawTx.destination,
          value: rawTx.value,
          data: rawTx.data,
          from: contractKit.defaultAccount,
          gas: 10000000,
          gasPrice: 10000000000
        })
        const txHash = await result.getHash()
        expect(txHash).toBeDefined()
      })
    })
  })

  describe('#submitTransaction', () => {
    let service: TransactionService

    beforeEach(async () => {
      service = await setupService({
        transactionTimeoutMs: 10000,
        transactionCheckIntervalMs: 500
      }, {})
      await service.onModuleInit()
    })

    describe('when the transaction result resolves', () => {
      it('submits the transaction to the chain, watched then unwatches', async () => {
        const tx = txFixture()
        
        const sendTransaction = jest.spyOn(contractKit, 'sendTransaction')
        // @ts-ignore
        const watchTransaction = jest.spyOn(service, 'watchTransaction')
        // @ts-ignore
        const unwatchTransaction = jest.spyOn(service, 'unwatchTransaction')
        // @ts-ignore
        const checkTransactions = jest.spyOn(service, 'checkTransactions')

        const rawTx = {
          destination: tx.to,
          data: tx.input,
          value: tx.value
        }

        const txHashResult = await service.submitTransaction(rawTx)
        const txHash = (txHashResult as OkResult<string>).result
        expect(txHash).toBeDefined()
        
        expect(sendTransaction).toHaveBeenCalledWith(expect.objectContaining({
          to: rawTx.destination,
          data: rawTx.data,
          value: rawTx.value,
          from: relayerAddress
        }))

        const completedTx = await contractKit.web3.eth.getTransaction(txHash)
        expect(completedTx.blockHash).toBeDefined()
        
        expect(watchTransaction).toHaveBeenCalledWith(txHash)
        expect(unwatchTransaction).not.toHaveBeenCalled()

        jest.advanceTimersToNextTimer(1)

        expect(checkTransactions).toHaveBeenCalled()
        
        // Shouldn't remove it from the unwatch list until it's finalized
        await setTimeout(() => {
          expect(unwatchTransaction).not.toHaveBeenCalledWith(txHash)
        })

        await setTimeout(() => {
          expect(unwatchTransaction).toHaveBeenCalledWith(txHash)
        })
      })
    })
  })
})