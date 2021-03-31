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
import { ChainErrorTypes, GasPriceBellowMinimum, GasPriceFetchError, NonceTooLow, TxDeadletterError, TxNotInCache, TxSubmitError } from 'apps/relayer/src/chain/errors'
import { RawTransactionDto } from 'apps/relayer/src/dto/RawTransactionDto'
import { RelayerTraceContext } from 'apps/relayer/src/dto/RelayerCommandDto'
import { Mutex } from 'async-mutex'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { Transaction } from 'web3-core'
import { AppConfig, appConfig } from '../config/app.config'

const ZERO_ADDRESS: Address = '0x0000000000000000000000000000000000000000'
const GWEI_PER_UNIT = 1e9

interface TxCachedData {
  nonce: number,
  gasPrice: string,
  seenAt: number,
  expireIn: number, // ms until tx gets expired
  traceContext?: RelayerTraceContext,
}

@Injectable()
export class TransactionService implements OnModuleInit, OnModuleDestroy {
  private watchedTransactions: Set<string>
  private transactions: Map<string, TxCachedData>
  private checksumWalletAddress: string
  private txTimer: NodeJS.Timeout
  private gasPriceTimer: NodeJS.Timeout
  private gasPrice: string = ""
  private nonceLock: Mutex
  private nonce: number

  constructor(
    private readonly kit: ContractKit,
    private readonly logger: KomenciLoggerService,
    @Inject(walletConfig.KEY) private walletCfg: WalletConfig,
    @Inject(appConfig.KEY) private appCfg: AppConfig,
    private readonly blockchainService: BlockchainService,
    private readonly balanceService: BalanceService,
  ) {
    this.watchedTransactions = new Set()
    this.transactions = new Map()
    this.checksumWalletAddress = Web3.utils.toChecksumAddress(walletCfg.address)
    this.nonceLock = new Mutex()
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

      const [txHash, nonce] = await this.nonceLock.runExclusive<[string, number]>(async () => {
        endedAcquireLock = Date.now()
        startedSend = Date.now()
        const result = await this.kit.sendTransaction({
          to: tx.destination,
          value: tx.value,
          data: tx.data,
          from: this.walletCfg.address,
          gas: this.appCfg.transactionMaxGas,
          gasPrice: this.gasPrice,
          nonce: this.nonce
        })
        const _txHash = await result.getHash()
        endedSend = Date.now()

        // If we don't do this explicitly it results in
        // an unhandled exception being logged if the
        // tx reverts.
        // tslint:disable-next-line:no-empty
        result.waitReceipt().then().catch(() => {})

        return [
          _txHash,
          this.nonce++,
        ]
      })

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
        nonce: nonce,
        destination: tx.destination
      }, ctx)

      return Ok(txHash)
    } catch (e) {
      if (e.message.match(/gasprice is less than gas price minimum/)) {
        const err = new GasPriceBellowMinimum(this.gasPrice)
        this.logger.warn(err)
        await this.updateGasPrice()
        return Err(err)
      } else if (e.message.match(/nonce too low/)) {
        this.logger.warn(`Nonce might be out of sync -- force an update`)
        await this.updateNonce()
        return Err(new NonceTooLow())
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
    const txs: Array<{hash: string, data: Transaction | null}> = await Promise.all(
      [...this.watchedTransactions].map(async (txHash) => {
        const transaction = await this.kit.web3.eth.getTransaction(txHash)
        if (transaction === null || transaction === undefined) {
          this.logger.warn(`Transaction ${txHash} not found in node`)
        }
        return { hash: txHash, data: transaction }
      }
      )
    )

    const completed = txs.filter(tx => tx.data && tx.data.blockHash !== null)
    if (completed.length > 0) {
      await this.balanceService.logBalance()
    }

    const expired = txs.filter(
      tx => (this.isExpired(tx.hash, tx.data))
    )

    await Promise.all(expired.map(tx => this.deadLetter(tx.hash)))
    await Promise.all(completed.map(tx => this.finalizeTransaction(tx.data)))
  }

  /**
   * Steps executed after a transaction has finalized
   * @param tx
   * @private
   */
  private async finalizeTransaction(tx: Transaction) {
    const ctx = this.transactions.get(tx.hash)?.traceContext
    const txReceipt = await this.kit.web3.eth.getTransactionReceipt(tx.hash)

    // XXX: receipt can be null in which case we wait for the next cycle to finalize
    if (txReceipt === null) {
      this.logger.warn(`Receipt null when trying to finalize transaction ${tx.hash}`)
      return
    }

    const gasPrice = parseInt(tx.gasPrice, 10)
    this.unwatchTransaction(tx.hash)
    this.logger.event(EventType.TxConfirmed, {
      status: txReceipt.status === false ? "Reverted" : "Ok",
      txHash: tx.hash,
      nonce: tx.nonce,
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
  @retry<[string], TxDeadletterError | NonceTooLow | GasPriceBellowMinimum>({
      tries: 3,
      bailOnErrorTypes: [ChainErrorTypes.NonceTooLow]
  })
  private async deadLetter(txHash: string, tx?: Transaction): Promise<
    Result<true, TxDeadletterError | NonceTooLow | GasPriceBellowMinimum>
  > {
    const cachedTxData = this.transactions.get(txHash)
    const gasPrice = new BigNumber(cachedTxData.gasPrice, 10).times(1.5).toFixed(0)

    try {
      const result = await this.kit.sendTransaction({
        to: this.walletCfg.address,
        from: this.walletCfg.address,
        value: '0',
        nonce: cachedTxData.nonce,
        gasPrice,
      })
      const deadLetterHash = await result.getHash()
      this.unwatchTransaction(txHash)

      this.watchTransaction(
        deadLetterHash, 
        {
          nonce: cachedTxData.nonce,
          gasPrice,
          expireIn: cachedTxData.expireIn * 2, // backoff expiry
          traceContext: cachedTxData.traceContext
        }
      )

      this.logger.event(EventType.TxTimeout, {
        destination: tx ? tx.to : "n/a",
        txHash: txHash,
        deadLetterHash,
        nonce: cachedTxData.nonce
      }, cachedTxData.traceContext)

      return Ok(true)
    } catch (e) {
      if (e.message.match(/nonce too low/)) {
        this.logger.warn(`Trying to deadletter a tx that probably when through: ${txHash}`)
        this.unwatchTransaction(txHash)
        return Err(new NonceTooLow())
      } else if (e.message.match(/gasprice is less than gas price minimum/)) {
        this.logger.warn(`GasPrice ${gasPrice} bellow minimum - triggering update`)
        await this.updateGasPrice()
        return Err(new GasPriceBellowMinimum(gasPrice))
      } else {
        const err = new TxDeadletterError(e, txHash)
        this.logger.errorWithContext(err, cachedTxData.traceContext)
        return Err(err)
      }
    }
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

  private isExpired(txHash: string, tx?: Transaction): boolean {
    if (tx && tx.blockHash !== null) { return false }
    const cachedTxData = this.transactions.get(txHash)
    if (cachedTxData && cachedTxData.seenAt) {
      return (
        Date.now() - cachedTxData.seenAt > cachedTxData.expireIn
      )
    } else {
      // XXX: This should never happen
      this.logger.error(new TxNotInCache(txHash))
      return true
    }
  }

  private async getPendingTransactions(): Promise<Array<{hash: string, nonce: number, gasPrice: string}>> {
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
          tx => ({hash: tx.hash, nonce: tx.nonce, gasPrice: tx.gasPrice})
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
