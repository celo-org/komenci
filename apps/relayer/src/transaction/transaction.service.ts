// tslint:disable-next-line:no-reference
/// <reference path="../../../../libs/celo/packages/contractkit/types/web3-celo.d.ts" />

import { BlockchainService } from '@app/blockchain/blockchain.service'
import { WalletConfig, walletConfig } from '@app/blockchain/config/wallet.config'
import { Err, Ok, Result } from '@celo/base/lib/result'
import { ContractKit } from '@celo/contractkit'
import { TransactionResult } from '@celo/contractkit/lib/utils/tx-result'
import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { Logger } from 'nestjs-pino'
import Web3 from 'web3'
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
    this.checksumWalletAddress = Web3.utils.toChecksumAddress(walletCfg.address)
  }

  async onModuleInit() {
    (await this.getPendingTransactionHashes()).forEach(txHash => this.watchTransaction(txHash))
    this.timer = setInterval(
      () => this.checkTransactions(),
      this.appCfg.transactionCheckIntervalMs
    )
  }

  onModuleDestroy() {
    clearInterval(this.timer)
  }

  async submitTransaction(tx: Tx): Promise<Result<string, any>> {
    let tries = 0
    while(++tries < 3) {
      try {
        const result = await this.kit.sendTransaction(tx)
        const txHash = await result.getHash()
        this.watchTransaction(txHash, result)
        return Ok(txHash)
      } catch(e) {
        if (tries === 3) {
          return Err(e)
        }
      }
    }
  }

  async submitTransactionObject(txo: TransactionObject<any>): Promise<Result<string, any>> {
    try {
      const result = await this.kit.sendTransactionObject(txo)
      const txHash = await result.getHash()
      this.watchTransaction(txHash)
      return Ok(txHash)
    } catch(e) {
      return Err(e)
    }
  }

  private async checkTransactions() {
    const txs = await Promise.all(
      [...this.watchedTransactions].map(txHash => this.kit.web3.eth.getTransaction(txHash))
    )

    const completed = txs.filter(tx => tx.blockHash !== null)
    completed.forEach(tx => this.unwatchTransaction(tx.hash))
    const expired = txs.filter(tx => tx.blockHash == null && this.isExpired(tx.hash))
    await Promise.all(expired.map(tx => this.deadLetter(tx)))
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
      this.unwatchTransaction(tx.hash)

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

  private watchTransaction(txHash: string, result?: TransactionResult) {
    this.watchedTransactions.add(txHash)
    this.transactionSeenAt.set(txHash, Date.now())

    if (result !== undefined) {
      this.waitForReceipt(result)
    }
  }

  private async waitForReceipt(result: TransactionResult) {
    const receipt = await result.waitReceipt()
    if (this.watchedTransactions.has(receipt.transactionHash)) {
      this.unwatchTransaction(receipt.transactionHash)
    } else {
      this.logger.warn({
        message: 'Tx resolved after being unwatched',
        txHash: receipt.transactionHash
      })
    }
  }

  private unwatchTransaction(txHash: string) {
    this.watchedTransactions.delete(txHash)
    this.transactionSeenAt.delete(txHash)
  }

  private isExpired(txHash: string): boolean {
    if (this.transactionSeenAt.has(txHash)) {
      return Date.now() - this.transactionSeenAt.get(txHash) > this.appCfg.transactionTimeoutMs
    } else {
      // This should never happen
      this.logger.error({
        message: "Transaction not in set",
        txHash
      })
      return true
    }
  }


  private async getPendingTransactionHashes(): Promise<string[]> {
    const txPoolRes = await this.blockchainService.getPendingTxPool()
    if (txPoolRes.ok === false) {
      this.logger.error({
        message: 'Could not fetch tx pool',
        originalError: txPoolRes.error.message
      })
      return []
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
