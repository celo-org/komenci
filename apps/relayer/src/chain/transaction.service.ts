// tslint:disable-next-line:no-reference
/// <reference path="../../../../libs/celo/packages/contractkit/types/web3-celo.d.ts" />

import { BlockchainService } from '@app/blockchain/blockchain.service'
import {
  WalletConfig,
  walletConfig
} from '@app/blockchain/config/wallet.config'
import { EventType, KomenciLoggerService } from '@app/komenci-logger'
import { Address, sleep } from '@celo/base'
import { Err, Ok, Result } from '@celo/base/lib/result'
import { ContractKit } from '@celo/contractkit'
import { toRawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit
} from '@nestjs/common'
import { BalanceService } from 'apps/relayer/src/chain/balance.service'
import { GasPriceFetchError, TxDeadletterError, TxSubmitError } from 'apps/relayer/src/chain/errors'
import { RawTransactionDto } from 'apps/relayer/src/dto/RawTransactionDto'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { Transaction } from 'web3-core'
import { TransactionObject } from 'web3-eth'
import { AppConfig, appConfig } from '../config/app.config'

const ZERO_ADDRESS: Address = '0x0000000000000000000000000000000000000000'
const GWEI_PER_UNIT = 1e9

@Injectable()
export class TransactionService implements OnModuleInit, OnModuleDestroy {
  private watchedTransactions: Set<string>
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

  submitTransaction = async (
    tx: RawTransactionDto
  ): Promise<Result<string, TxSubmitError>> => {
    let tries = 0
    while (++tries <= 3) {
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
        this.watchTransaction(txHash)


        this.logger.event(EventType.TxSubmitted, {
          txHash: txHash,
          destination: tx.destination
        })

        return Ok(txHash)
      } catch (e) {
        if (tries === 3) {
          const err = new TxSubmitError(e, tx)
          // this.logger.error(err)
          return Err(err)
        }
      }
    }
  }

  async submitTransactionObject(
    txo: TransactionObject<any>
  ): Promise<Result<string, any>> {
    return this.submitTransaction(toRawTransaction(txo))
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
    this.unwatchTransaction(tx.hash)

    const txReceipt = await this.kit.web3.eth.getTransactionReceipt(tx.hash)
    const gasPrice = parseInt(tx.gasPrice, 10)

    this.logger.event(EventType.TxConfirmed, {
      isRevert: txReceipt.status === false,
      txHash: tx.hash,
      gasUsed: txReceipt.gasUsed,
      gasPrice: gasPrice,
      gasCost: gasPrice * txReceipt.gasUsed,
      destination: tx.to
    })
  }


  /**
   * Replace expired transaction with a dummy transaction
   * @param tx Expired tx
   */
  private async deadLetter(tx: Transaction) {
    try {
      const result = await this.kit.sendTransaction({
        to: this.walletCfg.address,
        from: this.walletCfg.address,
        value: '0',
        nonce: tx.nonce
      })
      const deadLetterHash = await result.getHash()
      this.unwatchTransaction(tx.hash)
      this.watchTransaction(deadLetterHash)

      this.logger.event(EventType.TxTimeout, {
        destination: tx.to,
        txHash: tx.hash,
        deadLetterHash,
        nonce: tx.nonce
      })
    } catch (e) {
      const err = new TxDeadletterError(e, tx.hash)
      this.logger.error(err)
    }
  }

  private watchTransaction(txHash: string) {
    this.watchedTransactions.add(txHash)
    this.transactionSeenAt.set(txHash, Date.now())
  }

  private unwatchTransaction(txHash: string) {
    this.watchedTransactions.delete(txHash)
    this.transactionSeenAt.delete(txHash)
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
