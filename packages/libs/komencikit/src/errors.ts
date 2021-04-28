import { RootError } from '@celo/base/lib/result'

export enum FetchErrorTypes {
  Unauthorised = 'Unauthorised',
  RequestError = 'RequestError',
  ServiceUnavailable = 'ServiceUnavailable',
  UnexpectedStatus = 'UnexpectedStatus',
  NetworkError = 'NetworkError',
  DecodeError = 'DecodeError',
  NotFoundError = 'NotFoundError',
  QuotaExceededError = 'QuotaExceededError',
}

export class Unauthorised extends RootError<FetchErrorTypes.Unauthorised> {
  constructor() {
    super(FetchErrorTypes.Unauthorised)
  }
}

interface RequestErrorPayload {
  statusCode: number
  message: string | string[]
  error: string
}

export class RequestError extends RootError<FetchErrorTypes.RequestError> {
  constructor(public readonly data: RequestErrorPayload) {
    super(FetchErrorTypes.RequestError)
  }
}

export class ServiceUnavailable extends RootError<FetchErrorTypes.ServiceUnavailable> {
  constructor() {
    super(FetchErrorTypes.ServiceUnavailable)
  }
}

export class UnexpectedStatus extends RootError<FetchErrorTypes.UnexpectedStatus> {
  constructor(public readonly statusCode: number) {
    super(FetchErrorTypes.UnexpectedStatus)
  }
}

export class NetworkError extends RootError<FetchErrorTypes.NetworkError> {
  constructor(public readonly networkError: Error) {
    super(FetchErrorTypes.NetworkError)
  }
}

export class ResponseDecodeError extends RootError<FetchErrorTypes.DecodeError> {
  constructor(public readonly received: any) {
    super(FetchErrorTypes.DecodeError)
  }
}

export class NotFoundError extends RootError<FetchErrorTypes.NotFoundError> {
  constructor(public readonly path: string) {
    super(FetchErrorTypes.NotFoundError)
  }
}

export class QuotaExceededError extends RootError<FetchErrorTypes.QuotaExceededError> {
  constructor() {
    super(FetchErrorTypes.QuotaExceededError)
  }
}

export type FetchError =
  | Unauthorised
  | RequestError
  | ServiceUnavailable
  | UnexpectedStatus
  | NetworkError
  | ResponseDecodeError
  | NotFoundError
  | QuotaExceededError

export enum TxErrorTypes {
  Timeout = 'Timeout',
  Revert = 'Revert',
  EventNotFound = 'EventNotFound',
}

export class TxTimeoutError extends RootError<TxErrorTypes.Timeout> {
  public readonly message = "TxTimeoutError"
  constructor() {
    super(TxErrorTypes.Timeout)
  }
}

export class TxRevertError extends RootError<TxErrorTypes.Revert> {
  public readonly message: string
  constructor(public readonly txHash: string, public readonly reason: string) {
    super(TxErrorTypes.Revert)
    this.message = `Transaction reverted (reason: ${reason || 'n/a'})`
  }
}

export class TxEventNotFound extends RootError<TxErrorTypes.EventNotFound> {
  public readonly message: string
  constructor(public readonly txHash: string, public readonly event: string) {
    super(TxErrorTypes.EventNotFound)
    this.message = `Transaction should have emitted ${event}`
  }
}

export type TxError = TxTimeoutError | TxRevertError | TxEventNotFound

export enum KomenciErrorTypes {
  AuthenticationFailed = 'AuthenticationFailed',
}

export class AuthenticationFailed extends RootError<KomenciErrorTypes.AuthenticationFailed> {
  public readonly message: string
  constructor() {
    super(KomenciErrorTypes.AuthenticationFailed)
    this.message = "Komenci Authentication failed"
  }
}

export enum KomenciKitErrorTypes {
  KomenciDown = 'KomenciDown',
  LoginSignatureError = 'LoginSignatureError',
  InvalidWallet = 'InvalidWallet',
}

export class LoginSignatureError extends RootError<KomenciKitErrorTypes.LoginSignatureError> {
  public readonly message: string
  constructor(public readonly error: Error) {
    super(KomenciKitErrorTypes.LoginSignatureError)
    this.message = "Login signature invalid"
  }
}

export class InvalidWallet extends RootError<KomenciKitErrorTypes.InvalidWallet> {
  public readonly message: string
  constructor(public readonly error: WalletValidationError) {
    super(KomenciKitErrorTypes.InvalidWallet)
    this.message = "Wallet Invalid"
  }
}

export class KomenciDown extends RootError<KomenciKitErrorTypes.KomenciDown> {
  public readonly message: string
  constructor() {
    super(KomenciKitErrorTypes.KomenciDown)
    this.message = "Komenci Service down"
  }
}

export enum WalletVerificationErrorTypes {
  InvalidBytecode = 'InvalidBytecode',
  InvalidSigner = 'InvalidSigner',
  InvalidImplementation = 'InvalidImplementation',
}

export class InvalidBytecode extends RootError<WalletVerificationErrorTypes.InvalidBytecode> {
  public readonly message: string
  constructor(public readonly walletAddress: string) {
    super(WalletVerificationErrorTypes.InvalidBytecode)
    this.message = 'Invalid wallet bytecode, should be a Proxy'
  }
}

export class InvalidSigner extends RootError<WalletVerificationErrorTypes.InvalidBytecode> {
  constructor(
    public readonly walletAddress: string,
    public readonly actual: string,
    public readonly expected: string
  ) {
    super(WalletVerificationErrorTypes.InvalidBytecode)
    this.message = `Invalid signer got ${actual}, expected: ${expected}`
  }
}

export class InvalidImplementation extends RootError<WalletVerificationErrorTypes.InvalidBytecode> {
  constructor(
    public readonly walletAddress: string,
    public readonly actual: string,
    public readonly expected: string[]
  ) {
    super(WalletVerificationErrorTypes.InvalidBytecode)
    this.message = `Invalid implementation got ${actual}, expected one of: ${expected}`
  }
}

export type WalletValidationError = InvalidBytecode | InvalidImplementation | InvalidSigner
