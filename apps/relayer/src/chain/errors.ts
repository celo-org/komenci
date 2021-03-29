import { MetadataError } from '@app/komenci-logger/errors'
import { RootError } from '@celo/base'
import { RawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'

export enum ChainErrorTypes {
  TxSubmitError = "TxSubmitError",
  TxNotFoundError = "TxNotFoundError",
  TxDeadletterError = "TxDeadletterError",
  GasPriceFetchError = "GasPriceFetchError"
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
    this.message = `TxDeadletterError: ${err.message}`
  }
}

export class GasPriceFetchError extends RootError<ChainErrorTypes.GasPriceFetchError> {
  constructor(readonly err: Error) {
    super(ChainErrorTypes.GasPriceFetchError)
    this.message = `GasPriceFetchError: ${err.message}`
  }
}

export class TxNotFoundError extends RootError<ChainErrorTypes.TxNotFoundError> {
  metadataProps = ['txHash']

  constructor(readonly txHash: string) {
    super(ChainErrorTypes.TxNotFoundError)
    this.message = `TxNotFoundError: Error tx ${txHash} not found in node`
  }
}
