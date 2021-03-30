import { BlockchainService } from '@app/blockchain/blockchain.service'
import {
  WalletConfig,
  walletConfig
} from '@app/blockchain/config/wallet.config'
import { EventType, KomenciLoggerService } from '@app/komenci-logger'
import { Address, sleep } from '@celo/base'
import { Err, Ok, Result } from '@celo/base/lib/result'
import { CeloTxObject } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'
import { toRawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { retry } from '@celo/komencikit/lib/retry'
import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit
} from '@nestjs/common'
import { BalanceService } from 'apps/relayer/src/chain/balance.service'
import { GasPriceFetchError, TxDeadletterError, TxSubmitError } from 'apps/relayer/src/chain/errors'
import { RawTransactionDto } from 'apps/relayer/src/dto/RawTransactionDto'
import { RelayerTraceContext } from 'apps/relayer/src/dto/RelayerCommandDto'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { Transaction } from 'web3-core'
import { AppConfig, appConfig } from '../config/app.config'

const ZERO_ADDRESS: Address = '0x0000000000000000000000000000000000000000'
const GWEI_PER_UNIT = 1e9

@Injectable()
export class TransactionService implements OnModuleInit, OnModuleDestroy {
  private watchedTransactions: Set<string>
  private transactionCtx: Map<string, RelayerTraceContext>
  private transactionSeenAt: Map<string, number>
  private checksumWalletAddress: string
  private txTimer: NodeJS.Timeout
  private gasPriceTimer: NodeJS.Timeout
  private gasPrice: string = ""

  constructor(
    private readonly kit: ContractKit,
    private readonly logger: KomenciLoggerService,
    @Inject(walletConfig.KEY) private walletCfg: WalletConfig,
    @Inject(appConfig.KEY) private appCfg: AppConfig,
    private readonly blockchainService: BlockchainService,
    private readonly balanceService: BalanceService,
  ) {
    this.watchedTransactions = new Set()
    this.transactionSeenAt = new Map()
    this.transactionCtx = new Map()
    this.checksumWalletAddress = Web3.utils.toChecksumAddress(walletCfg.address)
  }

  async onModuleInit() {
    // Fetch the initial gas price
    await this.updateGasPrice()
    // Find pending txs and add to the watch list
    const pendingTxs = await this.getPendingTransactionHashes()
    pendingTxs.forEach(txHash =>
      this.watchTransaction(txHash)
    )
    // Monitor the watched transactions for finality
    this.txTimer = setInterval(
      () => this.checkTransactions(),
      this.appCfg.transactionCheckIntervalMs
    )
    // Periodically update gasPrice
    this.gasPriceTimer = setInterval(
      () => this.updateGasPrice(),
      this.appCfg.gasPriceUpdateIntervalMs
    )
  }

  onModuleDestroy() {
    clearInterval(this.txTimer)
    clearInterval(this.gasPriceTimer)
  }

  @retry<[RawTransactionDto, RelayerTraceContext], TxSubmitError>({
      tries: 3
  })
  async submitTransaction(
    tx: RawTransactionDto,
    ctx?: RelayerTraceContext
  ): Promise<Result<string, TxSubmitError>> {
    try {
      const result = await this.kit.sendTransaction({
        to: tx.destination,
        value: tx.value,
        data: tx.data,
        from: this.walletCfg.address,
        gas: this.appCfg.transactionMaxGas,
        gasPrice: this.gasPrice
      })

      // If we don't do this explicitly it results in
      // an unhandled exception being logged if the
      // tx reverts.
      // tslint:disable-next-line:no-empty
      result.waitReceipt().then().catch(() => {})

      const txHash = await result.getHash()
      this.watchTransaction(txHash, ctx)


      this.logger.event(EventType.TxSubmitted, {
        txHash: txHash,
        destination: tx.destination
      }, ctx)

      return Ok(txHash)
    } catch (e) {
      return Err(new TxSubmitError(e, tx))
    }
  }

  async submitTransactionObject(
    txo: CeloTxObject<any>,
    ctx?: RelayerTraceContext
  ): Promise<Result<string, TxSubmitError>> {
    return this.submitTransaction(toRawTransaction(txo), ctx)
  }

  private async checkTransactions() {
    const txs = await Promise.all(
      [...this.watchedTransactions].map(txHash =>
        this.kit.web3.eth.getTransaction(txHash)
      )
    )


    const completed = txs.filter(tx => tx.blockHash !== null)
    if (completed.length > 0) {
      await this.balanceService.logBalance()
    }

    const expired = txs.filter(
      tx => tx.blockHash == null && this.isExpired(tx.hash)
    )

    await Promise.all(expired.map(tx => this.deadLetter(tx)))
    await Promise.all(completed.map(tx => this.finalizeTransaction(tx)))
  }

  /**
   * Steps executed after a transaction has finalized
   * @param tx
   * @private
   */
  private async finalizeTransaction(tx: Transaction) {
    const ctx = this.transactionCtx.get(tx.hash)
    this.unwatchTransaction(tx.hash)

    const txReceipt = await this.kit.web3.eth.getTransactionReceipt(tx.hash)
    const gasPrice = parseInt(tx.gasPrice, 10)

    this.logger.event(EventType.TxConfirmed, {
      status: txReceipt.status === false ? "Reverted" : "Ok",
      txHash: tx.hash,
      gasUsed: txReceipt.gasUsed,
      gasPrice: gasPrice,
      gasCost: gasPrice * txReceipt.gasUsed,
      destination: tx.to
    }, ctx)
  }


  /**
   * Replace expired transaction with a dummy transaction
   * @param tx Expired tx
   */
  private async deadLetter(tx: Transaction) {
    const ctx = this.transactionCtx.get(tx.hash)
    try {
      const result = await this.kit.sendTransaction({
        to: this.walletCfg.address,
        from: this.walletCfg.address,
        value: '0',
        nonce: tx.nonce
      })
      const deadLetterHash = await result.getHash()
      this.unwatchTransaction(tx.hash)
      this.watchTransaction(deadLetterHash, ctx)

      this.logger.event(EventType.TxTimeout, {
        destination: tx.to,
        txHash: tx.hash,
        deadLetterHash,
        nonce: tx.nonce
      }, ctx)
    } catch (e) {
      const err = new TxDeadletterError(e, tx.hash)
      this.logger.errorWithContext(err, ctx)
    }
  }

  private watchTransaction(
    txHash: string,
    ctx?: RelayerTraceContext
  ) {
    this.watchedTransactions.add(txHash)
    this.transactionSeenAt.set(txHash, Date.now())
    if (ctx) {
      this.transactionCtx.set(txHash, ctx)
    }
  }

  private unwatchTransaction(txHash: string) {
    this.watchedTransactions.delete(txHash)
    this.transactionSeenAt.delete(txHash)
    this.transactionCtx.delete(txHash)
  }

  private isExpired(txHash: string): boolean {
    if (this.transactionSeenAt.has(txHash)) {
      return (
        Date.now() - this.transactionSeenAt.get(txHash) >
        this.appCfg.transactionTimeoutMs
      )
    } else {
      // This should never happen
      this.logger.error(
        'Transaction not in set',
        '',
        { txHash }
      )
      return true
    }
  }

  private async getPendingTransactionHashes(): Promise<string[]> {
    const txPoolRes = await this.blockchainService.getPendingTxPool()
    if (txPoolRes.ok === false) {
      if (txPoolRes.error.errorType === 'RPC') {
        this.logger.error(txPoolRes.error)
      }
      this.logger.error({
        message: 'Could not fetch tx pool',
        originalError: txPoolRes.error
      })
      return []
    } else if (txPoolRes.ok === true) {
      const txPool = txPoolRes.result
      if (this.checksumWalletAddress in txPool.pending) {
        return Object.values(txPool.pending[this.checksumWalletAddress]).map(
          tx => tx.hash
        )
      } else {
        this.logger.log('No pending transactions found for relayer')
        return []
      }
    }
  }

  private async updateGasPrice() {
    try {
      const gasPriceMinimum = await this.kit.contracts.getGasPriceMinimum()
      const rawGasPrice = await gasPriceMinimum.getGasPriceMinimum(ZERO_ADDRESS)
      const gasPrice = rawGasPrice.multipliedBy(this.appCfg.gasPriceMultiplier)
      this.gasPrice = BigNumber.min(gasPrice, this.appCfg.maxGasPrice).toFixed()
      this.logger.event(EventType.GasPriceUpdate, {
        gasPriceGwei: parseFloat(gasPrice.dividedBy(GWEI_PER_UNIT).toFixed()),
        cappedAtMax: gasPrice.gte(this.appCfg.maxGasPrice)
      })
    } catch (e) {
      this.logger.error(new GasPriceFetchError(e))
      if (this.gasPrice === "") {
        this.gasPrice = this.appCfg.gasPriceFallback.toString()
      }
    }
  }
}
