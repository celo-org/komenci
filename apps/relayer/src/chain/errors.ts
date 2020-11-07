import { MetadataError } from '@app/komenci-logger/errors'
import { RawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'

export enum ChainErrorTypes {
  TxSubmitError = "TxSubmitError",
  TxDeadletterError = "TxDeadletterError"
}

export class TxSubmitError extends MetadataError<ChainErrorTypes.TxSubmitError> {
  constructor(
    public readonly err: Error,
    meta: {message: string, tx: RawTransaction}
  ) {
    super(ChainErrorTypes.TxSubmitError, meta)
  }
}

export class TxDeadletterError extends MetadataError<ChainErrorTypes.TxDeadletterError> {
  constructor(
    public readonly err: Error,
    meta: {message: string, txHash: string}
  ) {
    super(ChainErrorTypes.TxDeadletterError, meta)
  }
}