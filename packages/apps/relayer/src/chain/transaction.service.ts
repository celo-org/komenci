import { Address, sleep } from '@celo/base'
import { Err, Ok, Result } from '@celo/base/lib/result'
import { CeloTxObject } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'
import { toRawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { BlockchainService } from '@komenci/blockchain/dist/blockchain.service'
import {
  WalletConfig,
  walletConfig
} from '@komenci/blockchain/dist/config/wallet.config'
import { retry } from '@komenci/kit/lib/retry'
import { EventType, KomenciLoggerService } from '@komenci/logger'
import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit
} from '@nestjs/common'
import { Mutex } from 'async-mutex'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { Transaction, TransactionReceipt } from 'web3-core'
import { BalanceService } from '../chain/balance.service'
import { 
  ChainErrorTypes, GasPriceBellowMinimum, GasPriceFetchError, 
  NonceTooLow, ReceiptNotFoundError, TxDeadletterError, 
  TxNotFoundError, TxNotInCache, TxSubmitError 
} from '../chain/errors'
import { AppConfig, appConfig } from '../config/app.config'
import { RawTransactionDto } from '../dto/RawTransactionDto'
import { RelayerTraceContext } from '../dto/RelayerCommandDto'
import { metrics } from './metrics'

const ZERO_ADDRESS: Address = '0x0000000000000000000000000000000000000000'
const GWEI_PER_UNIT = 1e9
const gasUsedByAccount: [string, number][] = []


interface TxCachedData {
  nonce: number,
  gasPrice: BigNumber,
  seenAt: number,
  expireIn: number, // ms until tx gets expired
  traceContext?: RelayerTraceContext,
}

interface TxSummary {
  hash: string
  cachedTx: TxCachedData,
  tx?: Transaction,
}

interface TxSummaryWithReceipt extends TxSummary {
  receipt: TransactionReceipt

}

enum TxDeadletterReason {
  GasTooLow = "GasTooLow",
  Expired = "Expired"
}

export async function getGas() {
  const totalGas = gasUsedByAccount.map(x => x[1]).reduce((a, b) => a + b, 0)
  const totalUsers = gasUsedByAccount.map(x => x[0]).filter((item, i, ar) => ar.indexOf(item) === i).length
  const gasByOnboarding = (totalGas/totalUsers!) || 0 
  gasUsedByAccount.splice(0, gasUsedByAccount.length -1)
  return gasByOnboarding  
}

@Injectable()
export class TransactionService implements OnModuleInit, OnModuleDestroy {
  private watchedTransactions: Set<string>
  private transactions: Map<string, TxCachedData>
  private checksumWalletAddress: string
  private txTimer: NodeJS.Timeout
  private gasPriceTimer: NodeJS.Timeout
  private gasPrice: BigNumber
  private nonceLock: Mutex
  private nonce: number

  constructor(
    private readonly kit: ContractKit,
    private readonly logger: KomenciLoggerService,
    @Inject(walletConfig.KEY) 
    private walletCfg: WalletConfig,
    @Inject(appConfig.KEY) 
    private appCfg: AppConfig,
    private readonly blockchainService: BlockchainService,
    private readonly balanceService: BalanceService,
  ) {
    this.watchedTransactions = new Set()
    this.transactions = new Map()
    this.checksumWalletAddress = Web3.utils.toChecksumAddress(walletCfg.address)
    this.nonceLock = new Mutex()
    this.gasPrice = new BigNumber(this.appCfg.gasPriceFallback)
  }

  async onModuleInit() {
    // Fetch the initial gas price
    await this.updateGasPrice()
    // Fetch the initial nonce
    await this.updateNonce()
    // Find pending txs and add to the watch list
    const pendingTxs = await this.getPendingTransactions()
    pendingTxs.forEach(({hash, nonce, gasPrice}) =>
      this.watchTransaction(hash, {
        nonce, 
        gasPrice,
        expireIn: this.appCfg.transactionTimeoutMs,
      })
    )
    // Monitor the watched transactions for finality
    this.txTimer = setInterval(
      async () => this.checkTransactions(),
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

  @retry<[RawTransactionDto, RelayerTraceContext], TxSubmitError | GasPriceBellowMinimum | NonceTooLow>({
      tries: 3
  })
  async submitTransaction(
    tx: RawTransactionDto,
    ctx?: RelayerTraceContext
  ): Promise<
    Result<string, TxSubmitError | GasPriceBellowMinimum | NonceTooLow>
  > {
    try {
      const startedAcquireLock = Date.now()
      let endedAcquireLock: number | null
      let startedSend: number | null
      let endedSend: number | null

      const [txHash, nonce] = await this.nonceLock.runExclusive<[string, number]>(
        async (): Promise<[string, number]> => {
          endedAcquireLock = Date.now()
          startedSend = Date.now()
          const _txHash = await this.sendTransaction(tx, this.gasPrice, this.nonce)
          endedSend = Date.now()


          return [
            _txHash,
            this.nonce++,
          ]
        }
      )

      this.watchTransaction(txHash, {
        nonce, 
        gasPrice: this.gasPrice, 
        expireIn: this.appCfg.transactionTimeoutMs,
        traceContext: ctx,
      })

      this.logger.event(EventType.TxSubmitted, {
        lockAcquiredDuration: endedAcquireLock - startedAcquireLock,
        sendDuration: endedSend - startedSend,
        txHash: txHash,
        gasPrice: this.gasPrice.toFixed(),
        nonce: nonce,
        destination: tx.destination
      }, ctx)

      return Ok(txHash)
    } catch (e) {
      if (e.message.match(/gasprice is less than gas price minimum/)) {
        const err = new GasPriceBellowMinimum(this.gasPrice.toFixed(0))
        this.logger.warnWithContext(err, ctx)
        await this.updateGasPrice()
        return Err(err)
      } else if (e.message.match(/nonce too low/)) {
        const err = new NonceTooLow()
        this.logger.warnWithContext(err, ctx)
        await this.updateNonce()
        return Err(err)
      } else {
        return Err(new TxSubmitError(e, tx))
      }
    }
  }

  async submitTransactionObject(
    txo: CeloTxObject<any>,
    ctx?: RelayerTraceContext
  ): Promise<Result<string, TxSubmitError | GasPriceBellowMinimum | NonceTooLow>> {
    return this.submitTransaction(toRawTransaction(txo), ctx)
  }

  private async checkTransactions() {
    const txs = await this.getTxSummaries()
    const gasTooLow = txs.filter(
      item => (this.hasGasTooLow(item))
    )

    const completed = txs.filter(item => item.tx && item.tx.blockHash !== null)
    if (completed.length > 0) {
      await this.balanceService.logBalance()
    }

    const expired = txs.filter(
      item => (this.isExpired(item))
    )

    await Promise.all(gasTooLow.map(item => this.deadLetter(item, TxDeadletterReason.GasTooLow)))
    await Promise.all(expired.map(item => this.deadLetter(item, TxDeadletterReason.Expired)))
    await Promise.all((await this.withReceipts(completed)).map(item => this.finalizeTransaction(item)))
  }

  private async withReceipts(txs: TxSummary[]): Promise<TxSummaryWithReceipt[]> {
    const batch = new this.kit.web3.BatchRequest()
    const result = Promise.all(
      txs.map(async (txSummary) => {
        return new Promise<TxSummaryWithReceipt>((resolve, reject) => {
          batch.add(
            // @ts-ignore
            this.kit.web3.eth.getTransactionReceipt.request(txSummary.hash, (_err, receipt) => {
              if (_err != null) { reject(_err) }
              return resolve({...txSummary, receipt})
            }),
          )
        })
      })
    )
    batch.execute()
    return result
  }

  private async getTxSummaries(): Promise<TxSummary[]> {
    const batch = new this.kit.web3.BatchRequest()
    const result = Promise.all(
      [...this.watchedTransactions].map(async (txHash) => {
        return new Promise<TxSummary>((resolve, reject) => {
          const cachedTxData = this.transactions.get(txHash)
          batch.add(
            // @ts-ignore
            this.kit.web3.eth.getTransaction.request(txHash, (_err, transaction) => {
              if (_err != null) { reject(_err) }
              if (transaction === null || transaction === undefined) {
                const err = new TxNotFoundError(txHash)
                this.logger.warnWithContext(err, cachedTxData?.traceContext)
              }
              if (cachedTxData === null) {
                this.logger.warn(new TxNotInCache(txHash))
              }
              resolve({ hash: txHash, tx: transaction, cachedTx: cachedTxData })
            }),
          )
        })
      })
    )
    batch.execute()
    return result
  }

  /**
   * Steps executed after a transaction has finalized
   * @param tx
   * @private
   */
  private async finalizeTransaction(txs: TxSummaryWithReceipt) {
    const ctx = this.transactions.get(txs.hash)?.traceContext

    // XXX: receipt can be null in which case we wait for the next cycle to finalize
    if (txs.receipt === null) {
      this.logger.warn(new ReceiptNotFoundError(txs.hash))
      return
    }

    const gasPrice = parseInt(txs.tx.gasPrice, 10)
    this.unwatchTransaction(txs.tx.hash)
    gasUsedByAccount.push([txs.receipt.to, txs.receipt.gasUsed])
    this.logger.event(EventType.TxConfirmed, {
      status: txs.receipt.status === false ? "Reverted" : "Ok",
      txHash: txs.tx.hash,
      nonce: txs.tx.nonce,
      gasUsed: txs.receipt.gasUsed,
      gasPrice: gasPrice,
      gasCost: gasPrice * txs.receipt.gasUsed,
      destination: txs.tx.to
    }, ctx)
  }

  /**
   * Replace expired transaction with a dummy transaction
   * @param tx Expired tx
   */
  @retry<[TxSummary, TxDeadletterReason], TxDeadletterError | NonceTooLow | GasPriceBellowMinimum>({
      tries: 3,
      bailOnErrorTypes: [ChainErrorTypes.NonceTooLow]
  })
  private async deadLetter(txs: TxSummary, reason: TxDeadletterReason): Promise<
    Result<true, TxDeadletterError | NonceTooLow | GasPriceBellowMinimum>
  > {
    const gasPrice = BigNumber.max(
      txs.cachedTx.gasPrice.times(1.4),
      this.gasPrice
    )

    try {
      const result = await this.kit.sendTransaction({
        to: this.walletCfg.address,
        from: this.walletCfg.address,
        value: '0',
        nonce: txs.cachedTx.nonce,
        gasPrice: gasPrice.toFixed(0)
      })
      const deadLetterHash = await result.getHash()
      this.unwatchTransaction(txs.hash)

      this.watchTransaction(
        deadLetterHash, 
        {
          nonce: txs.cachedTx.nonce,
          gasPrice,
          expireIn: txs.cachedTx.expireIn * 2, // backoff expiry
          traceContext: txs.cachedTx.traceContext
        }
      )

      this.logger.event(EventType.TxDeadletter, {
        reason,
        destination: txs.tx ? txs.tx.to : "n/a",
        txHash: txs.hash,
        deadLetterHash,
        nonce: txs.cachedTx.nonce
      }, txs.cachedTx.traceContext)

      return Ok(true)
    } catch (e) {
      if (e.message.match(/nonce too low/)) {
        this.logger.warn(`Trying to deadletter a tx that probably when through: ${txs.hash}`)
        this.unwatchTransaction(txs.hash)
        return Err(new NonceTooLow())
      } else if (e.message.match(/gasprice is less than gas price minimum/)) {
        this.logger.warn(`GasPrice ${gasPrice} bellow minimum - triggering update`)
        await this.updateGasPrice()
        return Err(new GasPriceBellowMinimum(gasPrice.toFixed(0)))
      } else {
        const err = new TxDeadletterError(e, txs.hash)
        this.logger.errorWithContext(err, txs.cachedTx.traceContext)
        return Err(err)
      }
    }
  }

  private async sendTransaction(
    tx: RawTransactionDto,
    gasPrice: BigNumber,
    nonce: number
  ): Promise<string> {
    const result = await this.kit.sendTransaction({
      to: tx.destination,
      value: tx.value,
      data: tx.data,
      from: this.walletCfg.address,
      gas: this.appCfg.transactionMaxGas,
      gasPrice: gasPrice.toFixed(0),
      nonce: nonce
    })
    // If we don't do this explicitly it results in
    // an unhandled exception being logged if the
    // tx reverts.
    // tslint:disable-next-line:no-empty
    result.waitReceipt().then().catch((e) => {
      this.logger.warn(e)
    })
    return result.getHash()
  }

  private watchTransaction(
    hash: string,
    cachedTx: Omit<TxCachedData, 'seenAt'>
  ) {
    this.watchedTransactions.add(hash)
    const payload: TxCachedData = {
      ...cachedTx,
      seenAt: Date.now()
    }
    this.transactions.set(hash, payload)
  }

  private unwatchTransaction(txHash: string) {
    this.watchedTransactions.delete(txHash)
    this.transactions.delete(txHash)
  }

  private isExpired(txs: TxSummary): boolean {
    if (txs.tx && txs.tx.blockHash !== null) { return false }
    if (txs.cachedTx && txs.cachedTx.seenAt) {
      return (
        Date.now() - txs.cachedTx.seenAt > txs.cachedTx.expireIn
      )
    } else {
      // XXX: This should never happen
      this.logger.error(new TxNotInCache(txs.hash))
      return true
    }
  }
  
  private hasGasTooLow(txs: TxSummary): boolean {
    if (txs.tx && txs.tx.blockHash !== null) { return false }
    if (txs.cachedTx == null) { return false }

    return txs.cachedTx.gasPrice.lt(this.gasPrice)
  }

  private async getPendingTransactions(): Promise<{hash: string, nonce: number, gasPrice: BigNumber}[]> {
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
          tx => ({hash: tx.hash, nonce: tx.nonce, gasPrice: new BigNumber(tx.gasPrice, 10)})
        )
      } else {
        this.logger.log('No pending transactions found for relayer')
        return []
      }
    }
  }

  private async updateNonce() {
    return this.nonceLock.runExclusive<void>(async () => {
      this.nonce = await this.kit.connection.nonce(this.walletCfg.address)
    })
  }

  private async updateGasPrice() {
    try {
      const gasPriceMinimum = await this.kit.contracts.getGasPriceMinimum()
      const rawGasPrice = await gasPriceMinimum.getGasPriceMinimum(ZERO_ADDRESS)
      const gasPrice = BigNumber.min(
        rawGasPrice.multipliedBy(this.appCfg.gasPriceMultiplier),
        this.appCfg.maxGasPrice
      )
      this.logger.event(EventType.GasPriceUpdate, {
        gasPriceGwei: parseFloat(this.gasPrice.dividedBy(GWEI_PER_UNIT).toFixed()),
        cappedAtMax: gasPrice.gte(this.appCfg.maxGasPrice)
      })
      this.gasPrice = gasPrice
    } catch (e) {
      this.logger.error(new GasPriceFetchError(e))
      if (this.gasPrice.isZero()) {
        this.gasPrice = new BigNumber(this.appCfg.gasPriceFallback, 10)
      }
    }
  }
}
