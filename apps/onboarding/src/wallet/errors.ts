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
    super(WalletErrorType.InvalidImplementation)
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

export class InvalidRootMethod extends ApiError<MetaTxValidationErrorTypes> {
  statusCode = 400
  metadataProps = ['method']

  constructor(readonly method: string) {
    super(MetaTxValidationErrorTypes.InvalidRootMethod)
  }
}

export class InvalidChildMethod extends ApiError<MetaTxValidationErrorTypes> {
  statusCode = 400
  metadataProps = ['method']

  constructor(readonly method: string) {
    super(MetaTxValidationErrorTypes.InvalidChildMethod)
  }
}

export class InvalidDestination extends ApiError<MetaTxValidationErrorTypes> {
  statusCode = 400
  metadataProps = ['destination']

  constructor(readonly destination: string) {
    super(MetaTxValidationErrorTypes.InvalidDestination)
  }
}

export class InputDecodeError extends ApiError<MetaTxValidationErrorTypes> {
  statusCode = 400
  metadataProps = []

  constructor(readonly error?: Error) {
    super(MetaTxValidationErrorTypes.InputDecodeError)
    this.message = this.error?.message
  }
}

export type MetaTxValidationError =
  InvalidRootMethod |
  InvalidChildMethod |
  InvalidDestination |
  InputDecodeError


