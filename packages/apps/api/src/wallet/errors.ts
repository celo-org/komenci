import { ApiError } from '@komenci/core'
import { WalletValidationError } from '@komenci/kit/lib/errors'
import { RootError } from '@celo/base/lib/result'
import { RawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'

export enum WalletErrorType {
  NotDeployed = "NotDeployed",
  InvalidImplementation = "InvalidImplementation",
  InvalidWallet = "InvalidWallet"
}

export class WalletNotDeployed extends RootError<WalletErrorType> {
  constructor() {
    super(WalletErrorType.NotDeployed)
  }
}

export class InvalidImplementation extends ApiError<WalletErrorType> {
  statusCode = 400
  metadataProps = ['address']

  constructor(readonly address: string) {
    super(WalletErrorType.InvalidImplementation)
    this.message = "Unexpected MetaTransactionWallet implementation address"
  }
}

export class InvalidWallet extends ApiError<WalletErrorType> {
  statusCode = 400
  metadataProps = ['reason']

  constructor(readonly reason: WalletValidationError) {
    super(WalletErrorType.InvalidWallet)
    this.message = "Invalid wallet"
  }
}

export type WalletError = WalletNotDeployed | InvalidImplementation | InvalidWallet

export enum TxParseErrorTypes {
  InvalidRootTransaction = "MetaTx.InvalidRootTransaction",
  TransactionNotAllowed = "MetaTx.TransactionNotAllowed",
  TransactionDecodeError = "MetaTx.TransactionDecodeError"
}

export class InvalidRootTransaction extends ApiError<TxParseErrorTypes> {
  statusCode = 400
  metadataProps = ['tx']

  constructor(readonly tx: RawTransaction) {
    super(TxParseErrorTypes.InvalidRootTransaction)
  }
}

export class TransactionNotAllowed extends ApiError<TxParseErrorTypes> {
  statusCode = 400
  metadataProps = ['tx']

  constructor(readonly tx: RawTransaction) {
    super(TxParseErrorTypes.TransactionNotAllowed)
  }
}

export class TransactionDecodeError extends ApiError<TxParseErrorTypes> {
  statusCode = 400
  metadataProps = ['tx']

  constructor(readonly tx: RawTransaction, readonly error: Error) {
    super(TxParseErrorTypes.TransactionDecodeError)
    this.message = error.message
  }
}

export type TxParseErrors =
  InvalidRootTransaction |
  TransactionNotAllowed |
  TransactionDecodeError

