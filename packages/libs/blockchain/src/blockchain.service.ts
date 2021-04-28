import { WEB3_PROVIDER } from './blockchain.providers'
import { Err, Ok, Result, RootError } from '@celo/base/lib/result'
import { Inject, Injectable } from '@nestjs/common'
import { isLeft } from 'fp-ts/Either'
import * as t from 'io-ts'
import { HttpProvider, Transaction } from 'web3-core'
import { formatters } from 'web3-core-helpers'

export const PoolTransaction  = t.type({
  hash: t.string,
  blockHash: t.union([t.string, t.null]),
  blockNumber: t.union([t.string, t.null]),
  transactionIndex: t.union([t.string, t.null]),
  from: t.string,
  to: t.union([t.string, t.null]),
  value: t.string,
  feeCurrency: t.union([t.string, t.null]),
  gatewayFee: t.string,
  gasPrice: t.string,
  gas: t.string,
  input: t.string,
  v: t.string,
  r: t.string,
  s: t.string,
})

export type PoolTransaction = t.TypeOf<typeof PoolTransaction>

export const TxPoolRaw = t.type({
  pending: t.record(
    t.string,
    t.record(t.string, PoolTransaction)
  ),
  queued: t.record(
    t.string,
    t.record(t.string, PoolTransaction)
  ),
})

export type TxPoolRaw = t.TypeOf<typeof TxPoolRaw>

export type TxPool = {
  pending: Record<string, Record<string, Transaction>>
  queued: Record<string, Record<string, Transaction>>
}

export enum BlockchainErrorTypes {
  NodeRPC = "RPC",
  Decode = "DecodeError"
}

export class NodeRPCError extends RootError<BlockchainErrorTypes.NodeRPC> {
  constructor(public error: Error) {
    super(BlockchainErrorTypes.NodeRPC)
  }
}

export class DecodeError extends RootError<BlockchainErrorTypes.Decode> {
  constructor(public errors: t.Errors) {
    super(BlockchainErrorTypes.Decode)
  }
}

export type BlockchainServiceError = NodeRPCError | DecodeError

@Injectable()
export class BlockchainService {
  constructor(
    // XXX: There's a better way in web3 1.3.0 but we're locked to 1.2.4 for now
    @Inject(WEB3_PROVIDER) private readonly web3Provider: Pick<HttpProvider, 'send'>
  ) {}

  public async getPendingTxPool(): Promise<Result<TxPool, BlockchainServiceError>> {
    return new Promise((resolve) => {
      this.web3Provider.send(
        {
          jsonrpc: '2.0',
          method: 'txpool_content',
          params: [],
          id: 1
        },
        (error, resp) => {
          if (error) {
            resolve(Err(new NodeRPCError(error)))
          } else {
            const decodeResult = TxPoolRaw.decode(resp.result)
            if (isLeft(decodeResult)) {
              resolve(Err(new DecodeError(decodeResult.left)))
            } else {
              resolve(Ok({
                pending: this.formatTransactions(decodeResult.right.pending),
                queued: this.formatTransactions(decodeResult.right.queued),
              }))
            }
          }
        }
      )
    })
  }

  private formatTransactions(
    rawTxMap: Record<string, Record<string, PoolTransaction>>
  ): Record<string, Record<string, Transaction>> {
    return Object.keys(rawTxMap).reduce(
      (pool, address) => {
        pool[address] = Object.keys(rawTxMap[address]).reduce(
          (addressTxs, nonce) => {
            addressTxs[nonce] = formatters.outputTransactionFormatter(rawTxMap[address][nonce])
            return addressTxs
          },
          {}
        )
        return pool
      },
      {}
    )

  }
}
