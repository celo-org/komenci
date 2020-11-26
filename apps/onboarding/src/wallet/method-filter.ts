import { extractMethodId, normalizeMethodId } from '@app/blockchain/utils'
import { Err, normalizeAddress, Ok, Result } from '@celo/base'
import { CeloContract } from '@celo/contractkit'
import { BaseWrapper } from '@celo/contractkit/lib/wrappers/BaseWrapper'
import { RawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { Contract } from 'web3-eth-contract'

export interface TransactionWithMetadata {
  raw: RawTransaction,
  methodId: string,
  methodName: string,
  contractName: string
}

export class MethodFilter {
  private allowed: Map<string, boolean> = new Map()
  private methodName: Map<string, string> = new Map()
  private contractName: Map<string, string> = new Map()

  addContract<T extends Contract>(
    name: CeloContract,
    wrapper: BaseWrapper<T>,
    methods: Array<keyof T["methods"]>
  ): MethodFilter {
    this.contractName.set(normalizeAddress(wrapper.address), name)
    methods.forEach(methodName => {
      const methodId = wrapper.methodIds[methodName]
      const methodKey = this.buildKey(wrapper.address, methodId)
      this.allowed.set(methodKey, true)
      this.methodName.set(methodKey, methodName as string)
    })

    return this
  }

  find(raw: RawTransaction): Result<TransactionWithMetadata, any> {
    const methodId = extractMethodId(raw.data)
    const key = this.buildKey(raw.destination, methodId)
    if (this.allowed.get(key) === true) {
      return Ok({
        raw: raw,
        methodId: methodId,
        methodName: this.methodName.get(key),
        contractName: this.contractName.get(normalizeAddress(raw.destination))
      })
    }
    return Err(new Error())
  }
  private buildKey(contractAddress, methodId: string): string {
    return `${normalizeAddress(contractAddress)}:${normalizeMethodId(methodId)}`
  }
}

