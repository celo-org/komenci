import { Address, Result } from '@celo/base'

export enum EventType {
    SessionStart = 'SessionStart',
    SessionStartFailure = 'SessionStartFailure',
    TxConfirmed = 'TxConfirmed',
    TxSubmitted = 'TxSubmitted',
    TxTimeout = 'TxTimeout',
    RuleVerified = 'RuleVerified',
    DeployWalletTxSent = 'DeployWalletTxSent',
    SendTransactionFailure = 'SendTransactionFailure',
    PepperRequested = 'PepperRequested',
    AttestationsRequested = 'AttestationsRequested',
    MetaTransactionSubmitted = 'MetaTransactionSubmitted'
}

export interface BaseEvent {
    type: EventType
}

export interface AccountEvent extends BaseEvent {
    externalAccount: Address
}

export interface SessionEvent extends AccountEvent{
    sessionId: string
}

export interface SessionStartEvent extends SessionEvent {
    type: EventType.SessionStart
}

export interface SessionStartFailureEvent extends BaseEvent {
    type: EventType.SessionStartFailure
}

export interface RelayerEvent extends BaseEvent {
    relayerAddress: Address
}

export interface RelayerTxEvent extends RelayerEvent {
    destination: Address
    txHash: string
}

export interface TxSubmitted extends RelayerTxEvent {
    type: EventType.TxSubmitted
}

export interface TxConfirmed extends RelayerTxEvent {
    type: EventType.TxConfirmed
    gasPrice: number
    gasUsed: number
    gasCost: number
    relayerCeloBalance: string
    relayerCUSDBalance: string
}

export interface TxTimeout extends RelayerTxEvent {
    type: EventType.TxTimeout
}

export interface RuleVerified extends AccountEvent {
    type: EventType.RuleVerified
    ruleId: string
    metaData?: Record<string, unknown>
    result: Result<boolean, any>
}

export interface DeployWalletTxSent extends SessionEvent {
    type: EventType.DeployWalletTxSent
    txHash: string
}

export interface PepperRequested extends RelayerEvent {
    type: EventType.PepperRequested,
    identifier: string
}

export interface AttestationsRequested extends SessionEvent {
    type: EventType.AttestationsRequested
    txHash: string
    relayerAddress: Address
    attestationsRequested: number
    identifier: string
}

export interface MetaTransactionSubmitted extends SessionEvent {
    type: EventType.MetaTransactionSubmitted
    txHash: string
    destination: Address
    metaTxMethodID: string
    metaTxDestination: Address
}

export interface SendTransactionFailure extends SessionEvent {
    type: EventType.SendTransactionFailure
    destination: Address
}

export type KEvent =
  SessionStartEvent |
  SessionStartFailureEvent |
  TxConfirmed |
  TxSubmitted |
  TxTimeout |
  RuleVerified |
  DeployWalletTxSent |
  SendTransactionFailure |
  PepperRequested |
  AttestationsRequested |
  MetaTransactionSubmitted

