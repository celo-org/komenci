import { ApiError } from '@app/komenci-logger/errors'
import { RootError } from '@celo/base/lib/result'
import { WalletValidationError } from '@celo/komencikit/lib/errors'

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

export class InvalidImplementation extends ApiError<WalletErrorType, {implementation: string}> {
  statusCode = 400
  constructor(implementation: string) {
    super(WalletErrorType.InvalidImplementation, { implementation })
    this.message = "Unexpected MetaTransactionWallet implementation address"
  }
}

export class InvalidWallet extends ApiError<WalletErrorType, {error: string}> {
  statusCode = 400
  constructor(private readonly walletError: WalletValidationError) {
    super(WalletErrorType.InvalidImplementation, { error: walletError.errorType })
    this.message = "Invalid wallet"
  }
}

export type WalletError = WalletNotDeployed | InvalidImplementation | InvalidWallet

export enum MetaTxValidationErrorTypes {
  InvalidRootMethod = "InvalidRootMethod",
  InvalidChildMethod = "InvalidChildMethod",
  InvalidDestination = "InvalidDestination",
  InputDecodeError = "InputDecodeError"
}

export class InvalidRootMethod extends ApiError<MetaTxValidationErrorTypes, {received: string}> {
  statusCode = 400
  constructor(public readonly received: string) {
    super(MetaTxValidationErrorTypes.InvalidRootMethod, { received })
  }
}

export class InvalidChildMethod extends ApiError<MetaTxValidationErrorTypes, {received: string}> {
  statusCode = 400
  constructor(public readonly received: string) {
    super(MetaTxValidationErrorTypes.InvalidChildMethod, { received })
  }
}

export class InvalidDestination extends ApiError<MetaTxValidationErrorTypes, {received: string}> {
  statusCode = 400
  constructor(public readonly received: string) {
    super(MetaTxValidationErrorTypes.InvalidDestination, { received })
  }
}

export class InputDecodeError extends ApiError<MetaTxValidationErrorTypes> {
  statusCode = 400
  constructor(public readonly error?: Error) {
    super(MetaTxValidationErrorTypes.InputDecodeError)
    this.message = this.error?.message
  }
}

export type MetaTxValidationError =
  InvalidRootMethod |
  InvalidChildMethod |
  InvalidDestination |
  InputDecodeError


