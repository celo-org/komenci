import { MetadataError } from '@app/komenci-logger/errors'
import { RawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'

export enum ChainErrorTypes {
  TxSubmitError = "TxSubmitError",
  TxDeadletterError = "TxDeadletterError"
}

export class TxSubmitError extends MetadataError<ChainErrorTypes.TxSubmitError> {
  metadataProps = ['tx']

  constructor(public readonly err: Error, readonly tx: RawTransaction) {
    super(ChainErrorTypes.TxSubmitError)
    this.message = `TxSubmitError: ${err.message}`
  }
}

export class TxDeadletterError extends MetadataError<ChainErrorTypes.TxDeadletterError> {
  metadataProps = ['txHash']

  constructor(readonly err: Error, readonly txHash: string) {
    super(ChainErrorTypes.TxDeadletterError)
    this.message = `TxSubmitError: ${err.message}`
  }
}