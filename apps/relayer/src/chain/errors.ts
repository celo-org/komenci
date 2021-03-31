import { MetadataError } from '@app/komenci-logger/errors'
import { RootError } from '@celo/base'
import { RawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'

export enum ChainErrorTypes {
  TxSubmitError = "TxSubmitError",
  TxNotFoundError = "TxNotFoundError",
  ReceiptNotFoundError = "ReceiptNotFoundError",
  TxDeadletterError = "TxDeadletterError",
  TxSpeedUpError = "TxSpeedUpError",
  GasPriceFetchError = "GasPriceFetchError",
  NonceTooLow = "NonceTooLow",
  GasPriceBellowMinimum = "GasPriceBellowMinimum",
  TxNotInCache = "TxNotInCache"
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

export class TxSpeedUpError extends MetadataError<ChainErrorTypes.TxSpeedUpError> {
  metadataProps = ['txHash']

  constructor(readonly err: Error, readonly txHash: string) {
    super(ChainErrorTypes.TxSpeedUpError)
    this.message = `TxSpeedUpError: ${err.message}`
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
    this.message = `TxNotFoundError: ${txHash} not found in node`
  }
}

export class ReceiptNotFoundError extends RootError<ChainErrorTypes.ReceiptNotFoundError> {
  metadataProps = ['txHash']

  constructor(readonly txHash: string) {
    super(ChainErrorTypes.ReceiptNotFoundError)
    this.message = `Receipt not found for ${txHash}`
  }
}

export class NonceTooLow extends RootError<ChainErrorTypes.NonceTooLow> {
  constructor() {
    super(ChainErrorTypes.NonceTooLow)
    this.message = "Nonce too low"
  }
}

export class GasPriceBellowMinimum extends RootError<ChainErrorTypes.GasPriceBellowMinimum> {
  metadataProps = ['gasPrice']
  constructor(readonly gasPrice: string) {
    super(ChainErrorTypes.GasPriceBellowMinimum)
    this.message = `Gas price bellow minium: ${gasPrice}`
  }
}

export class TxNotInCache extends RootError<ChainErrorTypes.TxNotInCache> {
  metadataProps = ['txHash']

  constructor(readonly txHash: string) {
    super(ChainErrorTypes.TxNotInCache)
    this.message = `TxNotInCache: ${txHash} not found in cache`
  }
}