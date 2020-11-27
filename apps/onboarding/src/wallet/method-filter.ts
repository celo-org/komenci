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

interface Method {
  methodName: string,
  contractName: CeloContract
}

export class MethodFilter {
  private methods: Map<string, Method> = new Map()

  addContract<T extends Contract>(
    name: CeloContract,
    wrapper: BaseWrapper<T>,
    methods: Array<keyof T["methods"]>
  ): MethodFilter {
    methods.forEach(methodName => {
      const methodId = wrapper.methodIds[methodName]
      const methodKey = this.buildKey(wrapper.address, methodId)
      this.methods.set(methodKey, {
        methodName: `${methodName}`,
        contractName: name
      })
    })

    return this
  }

  find(raw: RawTransaction): Result<TransactionWithMetadata, any> {
    const methodId = extractMethodId(raw.data)
    const key = this.buildKey(raw.destination, methodId)
    const method = this.methods.get(key)

    if (method) {
      return Ok({
        raw: raw,
        methodId: methodId,
        ...method,
      })
    }
    return Err(new Error())
  }

  private buildKey(contractAddress, methodId: string): string {
    return `${normalizeAddress(contractAddress)}:${normalizeMethodId(methodId)}`
  }
}

