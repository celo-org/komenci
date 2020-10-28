import { ApiError } from '@app/onboarding/errors/api-error'
import { RootError } from '@celo/base/lib/result'
import { Input } from '@nestjs/cli/commands'

export enum WalletErrorType {
  NotDeployed = "NotDeployed",
  InvalidImplementation = "InvalidImplementation"
}

export class WalletNotDeployed extends RootError<WalletErrorType> {
  constructor() {
    super(WalletErrorType.NotDeployed)
  }
}

export class InvalidImplementation extends ApiError<WalletErrorType, {implementation: string}> {
  statusCode = 400
  constructor(implementation: string) {
    super(WalletErrorType.InvalidImplementation)
    this.message = "Unexpected MetaTransactionWallet implementation address"
    this.metadata = { implementation }
  }
}

export type WalletError = WalletNotDeployed | InvalidImplementation

export enum MetaTxValidationErrorTypes {
  InvalidRootMethod = "InvalidRootMethod",
  InvalidChildMethod = "InvalidChildMethod",
  InvalidDestination = "InvalidDestination",
  InputDecodeError = "InputDecodeError"
}

export class InvalidRootMethod extends RootError<MetaTxValidationErrorTypes> {
  constructor(public readonly received: string) {
    super(MetaTxValidationErrorTypes.InvalidRootMethod)
  }
}

export class InvalidChildMethod extends RootError<MetaTxValidationErrorTypes> {
  constructor(public readonly received: string) {
    super(MetaTxValidationErrorTypes.InvalidChildMethod)
  }
}

export class InvalidDestination extends RootError<MetaTxValidationErrorTypes> {
  constructor(public readonly received: string) {
    super(MetaTxValidationErrorTypes.InvalidDestination)
  }
}

export class InputDecodeError extends RootError<MetaTxValidationErrorTypes> {
  constructor(public readonly error?: Error) {
    super(MetaTxValidationErrorTypes.InputDecodeError)
  }
}

export type MetaTxValidationError =
  InvalidRootMethod |
  InvalidChildMethod |
  InvalidDestination |
  InputDecodeError



