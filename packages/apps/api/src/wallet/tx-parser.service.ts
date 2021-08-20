import { Err, normalizeAddress, Ok, Result } from '@celo/base'
import { CeloContract, ContractKit, StableToken } from '@celo/contractkit'
import { BaseWrapper } from '@celo/contractkit/lib/wrappers/BaseWrapper'
import { MetaTransactionWalletWrapper, RawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { extractMethodId, normalizeMethodId } from '@komenci/core'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { decodeExecuteMetaTransaction, decodeExecuteTransactions } from '../wallet/decode-txs'
import {
  InvalidRootTransaction,
  TransactionDecodeError,
  TransactionNotAllowed,
  TxParseErrors,
} from '../wallet/errors'
import { MethodFilter, TransactionWithMetadata } from '../wallet/method-filter'

@Injectable()
export class TxParserService implements OnModuleInit {
  defaultFilter: MethodFilter
  constructor(
    private readonly contractKit: ContractKit
  ) {}

  async onModuleInit() {
    this.defaultFilter = new MethodFilter().addContract(
      CeloContract.Attestations,
      await this.contractKit.contracts.getAttestations(),
      ["selectIssuers", "complete"]
    ).addContract(
      CeloContract.Accounts,
      await this.contractKit.contracts.getAccounts(),
      ["setAccount"]
    ).addContract(
      CeloContract.StableToken,
      await this.contractKit.contracts.getStableToken(),
      ["approve", "transfer"]
    ).addContract(
      CeloContract.StableTokenEUR,
      await this.contractKit.contracts.getStableToken(StableToken.cEUR),
      ["approve", "transfer"]
    ).addContract(
      CeloContract.Escrow,
       await this.contractKit.contracts.getEscrow(),
      ["withdraw"]
    )
  }

  async parse(
    tx: RawTransaction,
    metaTxWalletAddress: string,
    methodFilter?: MethodFilter
  ): Promise<Result<TransactionWithMetadata[], TxParseErrors>> {
    const wallet = await this.contractKit.contracts.getMetaTransactionWallet(metaTxWalletAddress)
    if (!isCallTo(tx, wallet, 'executeMetaTransaction')) {
      return Err(new InvalidRootTransaction(tx))
    }
    const childrenResp = this.getChildren(tx, wallet)
    if (childrenResp.ok === false) {
      return childrenResp
    }

    methodFilter = methodFilter || this.defaultFilter
    const children: TransactionWithMetadata[] = []

    for (const child of childrenResp.result) {
      const method = methodFilter.find(child)
      if (method.ok) {
        children.push(method.result)
      } else {
        return Err(new TransactionNotAllowed(child))
      }
    }

    return Ok(children)
  }

  private getChildren(
    tx: RawTransaction,
    wallet: MetaTransactionWalletWrapper
  ): Result<RawTransaction[], TransactionDecodeError> {
    const childResp = decodeExecuteMetaTransaction(tx)
    if (childResp.ok === false) {
      return childResp
    }
    const child = childResp.result

    if (isCallTo(child, wallet, 'executeTransactions')) {
      return decodeExecuteTransactions(child)
    } else {
      return Ok([child])
    }
  }
}

const isCallTo = <TContract extends BaseWrapper<any>>(
  tx: RawTransaction,
  contract: TContract,
  method: keyof TContract["methodIds"]
): boolean => {
  return normalizeAddress(tx.destination) === normalizeAddress(contract.address) &&
    extractMethodId(tx.data) === normalizeMethodId(contract.methodIds[method])
}

