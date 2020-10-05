// tslint:disable-next-line:no-reference
/// <reference path="../../../../libs/celo/packages/contractkit/types/web3-celo.d.ts" />

import { BlockchainService } from '@app/blockchain/blockchain.service'
import { WalletConfig, walletConfig } from '@app/blockchain/config/wallet.config'
import { Err, Ok, Result } from '@celo/base/lib/result'
import { ContractKit } from '@celo/contractkit'
import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { Logger } from 'nestjs-pino'
import { Transaction, Tx } from 'web3-core'
import { TransactionObject } from 'web3-eth'
import { AppConfig, appConfig } from '../config/app.config'

@Injectable()
export class TransactionService implements OnModuleInit, OnModuleDestroy {
  private watchedTransactions: Set<string>
  private transactionSeenAt: Map<string, number>
  private checksumWalletAddress: string
  private timer: NodeJS.Timeout

  constructor(
    private readonly kit: ContractKit,
    private readonly logger: Logger,
    @Inject(walletConfig.KEY) private walletCfg: WalletConfig,
    @Inject(appConfig.KEY) private appCfg: AppConfig,
    private readonly blockchainService: BlockchainService,
  ) {
    this.watchedTransactions = new Set()
    this.transactionSeenAt = new Map()
    this.checksumWalletAddress = kit.web3.utils.toChecksumAddress(walletCfg.address)
  }

  async onModuleInit() {
    (await this.getPendingTransactionHashes()).forEach(this.watchTx)
    this.timer = setInterval(this.checkTransactions, this.appCfg.transactionCheckIntervalMs)
  }

  onModuleDestroy() {
    clearInterval(this.timer)
  }

  async submitTransaction(tx: Tx): Promise<Result<string, any>> {
    try {
      const result = await this.kit.sendTransaction(tx)
      const txHash = await result.getHash()
      this.watchTx(txHash)
      return Ok(txHash)
    } catch(e) {
      return Err(e)
    }
  }

  async submitTransactionObject(txo: TransactionObject<any>): Promise<Result<string, any>> {
    try {
      const result = await this.kit.sendTransactionObject(txo)
      const txHash = await result.getHash()
      this.watchTx(txHash)
      return Ok(txHash)
    } catch(e) {
      return Err(e)
    }
  }

  private watchTx(hash: string) {
    this.watchedTransactions.add(hash)
    this.transactionSeenAt.set(hash, Date.now())
  }

  private async checkTransactions() {
    const txs = await Promise.all(
      [...this.watchedTransactions].map(hash => this.kit.web3.eth.getTransaction(hash))
    )

    const pendingTxs = txs.filter(tx => tx.blockHash == null)
    txs.filter(tx => tx.blockHash !== null).forEach(tx => {
      this.watchedTransactions.delete(tx.hash)
    })


    const smallestNonceTx = pendingTxs.reduce(
      (smallest, current) => {
        if (current.nonce < smallest.nonce) {
          return current
        }
      }
    , pendingTxs[0])

    if (Date.now() - this.transactionSeenAt.get(smallestNonceTx.hash) > this.appCfg.transactionTimeoutMs) {
      await this.deadLetter(smallestNonceTx)
    }
  }

  private async deadLetter(tx: Transaction) {
    try {
      const result = await this.kit.sendTransaction({
        to: this.walletCfg.address,
        from: this.walletCfg.address,
        value: "0",
        nonce: tx.nonce
      })
      const deadLetterHash = await result.getHash()
      this.logger.log({
        message: "Dead-lettered transaction",
        txHash: tx.hash,
        deadLetterHash,
        nonce: tx.nonce,
      })
    } catch(e) {
      this.logger.error({
        message: "Could not dead-letter transaction",
        txHash: tx.hash,
        nonce: tx.nonce
      })

    }
  }

  private async getPendingTransactionHashes(): Promise<string[]> {
    const txPoolRes = await this.blockchainService.getPendingTxPool()
    if (txPoolRes.ok === false) {
      this.logger.error(`Could not get txpool: ${txPoolRes.error.message}`)
    } else if (txPoolRes.ok === true) {
      const txPool = txPoolRes.result
      if (this.checksumWalletAddress in txPool.pending) {
        return Object.values(txPool.pending[this.checksumWalletAddress]).map(tx => tx.hash)
      } else {
        this.logger.log('No pending transactions found for relayer')
        return []
      }
    }
  }
}
