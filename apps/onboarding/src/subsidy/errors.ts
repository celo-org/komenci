import { RootError } from '@celo/base/lib/result'

export enum SubsidyErrorTypes {
  WalletSignerMismatchError = "WalletSignerMismatchError",
  InvalidMetaTransaction = "InvalidMetaTransaction"
}

export class WalletSignerMismatchError extends RootError<SubsidyErrorTypes.WalletSignerMismatchError> {
  constructor(expected: string, session: string) {
    super(SubsidyErrorTypes.WalletSignerMismatchError)
    this.message = `Wallet doesn't belong to action initiator (wallet: ${expected}, session: ${session})`
  }
}

export class InvalidMetaTransaction extends RootError<SubsidyErrorTypes.InvalidMetaTransaction> {
  constructor(public readonly context: string) {
    super(SubsidyErrorTypes.InvalidMetaTransaction)
    this.message = `Invalid meta transaction received ${context}`
  }
}

export type SubsidyError = WalletSignerMismatchError | InvalidMetaTransaction