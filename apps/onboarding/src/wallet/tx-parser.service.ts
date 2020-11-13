import { extractMethodId, normalizeMethodId } from '@app/blockchain/utils'
import {
  InvalidRootTransaction, TransactionDecodeError, TransactionNotAllowed,
  TxParseErrors,
} from '@app/onboarding/wallet/errors'
import { Address, Err, normalizeAddress, Ok, Result } from '@celo/base'
import { ContractKit } from '@celo/contractkit'
import { ABI as MetaTxWalletABI } from '@celo/contractkit/lib/generated/MetaTransactionWallet'
import { BaseWrapper } from '@celo/contractkit/lib/wrappers/BaseWrapper'
import { MetaTransactionWalletWrapper, RawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { Injectable, OnModuleInit } from '@nestjs/common'

export type AllowedTransactions = Record<Address, Record<string, boolean>>

const InputDataDecoder = require('ethereum-input-data-decoder')
const MetaTxWalletDecoder = new InputDataDecoder(MetaTxWalletABI)

@Injectable()
export class TxParserService implements OnModuleInit {
  defaultAllowedTransactions: AllowedTransactions
  constructor(
    private readonly contractKit: ContractKit
  ) {}

  async onModuleInit() {
    const attestations = await this.contractKit.contracts.getAttestations()
    const accounts = await this.contractKit.contracts.getAccounts()
    const cUSD = await this.contractKit.contracts.getStableToken()
    const escrow = await this.contractKit.contracts.getEscrow()

    this.defaultAllowedTransactions = normalizeAllowed({
      [attestations.address]: {
        [attestations.methodIds.selectIssuers]: true,
        [attestations.methodIds.complete]: true,
      },
      [accounts.address]: {
        [accounts.methodIds.setAccount]: true
      },
      [cUSD.address]: {
        [cUSD.methodIds.approve]: true,
        [cUSD.methodIds.transfer]: true,
      },
      [escrow.address]: {
        [escrow.methodIds.withdraw]: true
      }
    })
  }

  async parse(
    tx: RawTransaction,
    metaTxWalletAddress: string,
    allowedTransactions?: AllowedTransactions
  ): Promise<Result<RawTransaction[], TxParseErrors>> {
    const wallet = await this.contractKit.contracts.getMetaTransactionWallet(metaTxWalletAddress)
    if (!isCallTo(tx, wallet, 'executeMetaTransaction')) {
      return Err(new InvalidRootTransaction(tx))
    }
    const childrenResp = this.getChildren(tx, wallet)
    if (childrenResp.ok === false) {
      return childrenResp
    }

    allowedTransactions = allowedTransactions === undefined
      ? this.defaultAllowedTransactions
      : normalizeAllowed(allowedTransactions)

    for (const child of childrenResp.result) {
      const normDest = normalizeAddress(child.destination)
      const methodId = extractMethodId(child.data)

      if (!(
        allowedTransactions[normDest] &&
        allowedTransactions[normDest][methodId] === true
      )) {
        return Err(new TransactionNotAllowed(child))
      }
    }

    return Ok(childrenResp.result)
  }

  private getChildren(
    tx: RawTransaction,
    wallet: MetaTransactionWalletWrapper
  ): Result<RawTransaction[], TransactionDecodeError> {
    const childResp = this.decodeExecuteMetaTransaction(tx)
    if (childResp.ok === false) {
      return childResp
    }
    const child = childResp.result

    if (isCallTo(child, wallet, 'executeTransactions')) {
      return this.decodeExecuteTransactions(child)
    } else {
      return Ok([child])
    }
  }

  private decodeExecuteMetaTransaction(tx: RawTransaction): Result<RawTransaction, TransactionDecodeError> {
    const result = this.decode<[string, any, Buffer]>(
      tx,
      'executeMetaTransaction',
      6
    )

    if (result.ok === false) {
      return result
    }
    const inputs = result.result

    return Ok({
      destination: inputs[0],
      value: inputs[1].toString(),
      data: inputs[2].toString('hex')
    })
  }

  private decodeExecuteTransactions(tx: RawTransaction): Result<RawTransaction[], TransactionDecodeError> {
    const result = this.decode<[string[], any[], Buffer, number[]]>(
      tx,
      'executeTransactions',
      4
    )

    if (result.ok === false) {
      return result
    }

    const inputs = result.result
    let offset = 0
    return Ok(inputs[3].map((dataLength, idx) => {
      let data: string
      if (dataLength === 0) {
        data = ""
      } else {
        data = inputs[2].slice(offset, offset+dataLength).toString('hex')
        offset += dataLength
      }
      return  {
        destination: inputs[0][idx],
        value: inputs[1][idx].toString(),
        data
      }
    }))
  }

  private decode<TxInput extends any[]>(
    tx: RawTransaction,
    method: string,
    expectedInputsLength: number
  ): Result<TxInput, TransactionDecodeError> {
    let decodedData: any
    try {
      decodedData = MetaTxWalletDecoder.decodeData(tx.data)
    } catch (e) {
      return Err(new TransactionDecodeError(tx, e))
    }

    if (decodedData.method === null) {
      return Err(new TransactionDecodeError(tx, new Error("Could not find method")))
    }

    if (decodedData.method !== method) {
      return Err(new TransactionDecodeError(tx, new Error("Method does not match")))
    }

    if (decodedData.inputs.length !== expectedInputsLength) {
      return Err(new TransactionDecodeError(tx, new Error('Invalid inputs length')))
    }

    return Ok(decodedData.inputs)
  }

}

const normalizeAllowed = (allowedMap: AllowedTransactions): AllowedTransactions => {
  return Object.keys(allowedMap).reduce((addressAcc, address) => {
    addressAcc[normalizeAddress(address)] = Object.keys(
      allowedMap[address]
    ).reduce((methodAcc, methodId) => {
      methodAcc[normalizeMethodId(methodId)] = allowedMap[address][methodId]
      return methodAcc
    }, {})
    return addressAcc
  }, {})
}

const isCallTo = <TContract extends BaseWrapper<any>>(
  tx: RawTransaction,
  contract: TContract,
  method: keyof TContract["methodIds"]
): boolean => {
  return normalizeAddress(tx.destination) === normalizeAddress(contract.address) &&
    extractMethodId(tx.data) === normalizeMethodId(contract.methodIds[method])
}

