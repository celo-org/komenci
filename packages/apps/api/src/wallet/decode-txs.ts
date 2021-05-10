import { Err, Ok, Result } from '@celo/base'
import { ABI as MetaTxWalletABI } from '@celo/contractkit/lib/generated/MetaTransactionWallet'
import { RawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { TransactionDecodeError } from '../wallet/errors'

const InputDataDecoder = require('ethereum-input-data-decoder')
const MetaTxWalletDecoder = new InputDataDecoder(MetaTxWalletABI)

const EXECUTE_TRANSACTIONS_INPUTS = 4
const EXECUTE_META_TRANSACTION_INPUTS = 6

export const decodeExecuteMetaTransaction = (
  tx: RawTransaction
): Result<RawTransaction, TransactionDecodeError> => {
  const result = decode<[string, any, Buffer]>(
    tx,
    'executeMetaTransaction',
    EXECUTE_META_TRANSACTION_INPUTS
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

export const decodeExecuteTransactions = (
  tx: RawTransaction
): Result<RawTransaction[], TransactionDecodeError> => {
  const result = decode<[string[], any[], Buffer, number[]]>(
    tx,
    'executeTransactions',
    EXECUTE_TRANSACTIONS_INPUTS
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
const decode = <TxInput extends any[]>(
  tx: RawTransaction,
  method: string,
  expectedInputsLength: number
): Result<TxInput, TransactionDecodeError> => {
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


