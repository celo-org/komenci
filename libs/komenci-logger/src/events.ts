import { Address, Result } from '@celo/base'

export enum KomenciEventType {
    SessionStartEvent = 'SessionStartEvent',
    SessionStartFailureEvent = 'SessionStartFailureEvent',
    TxEvent = 'TxEvent',
    RuleVerified = 'RuleVerified',
    DeployWalletTxSent = 'DeployWalletTxSent',
    SendTransactionFailure = 'SendTransactionFailure',
    PepperRequested = 'PepperRequested',
    AttestationsRequested = 'AttestationsRequested',
    MetaTransactionSubmitted = 'MetaTransactionSubmitted'
}

export interface BaseKomenciEvent {
    externalAccount: Address
}

export interface KomenciEvent extends BaseKomenciEvent{
    sessionId: string
}

export type SessionStartEvent = KomenciEvent

export type SessionStartFailureEvent = BaseKomenciEvent

export interface TxEvent {
    relayerAddress: Address
    destination: Address
    txHash: string
    gasPrice: number
    gasUsed: number
    gasCost: number
    relayerCeloBalance: string
    relayerCUSDBalance: string
}

export interface RuleVerified extends BaseKomenciEvent {
    ruleId: string
    metaData?: Record<string, unknown>
    result: Result<boolean, any>
}

export interface DeployWalletTxSent extends KomenciEvent {
    txHash: string
}

export interface PepperRequested extends KomenciEvent {
    relayerAddress: Address
    identifier: string
}

export interface AttestationsRequested extends KomenciEvent {
    txHash: string
    relayerAddress: Address
    attestationsRequested: number
    identifier: string
}

export interface MetaTransactionSubmitted extends KomenciEvent {
    txHash: string
    destination: Address
    metaTxMethodID: string
    metaTxDestination: Address
}

export interface SendTransactionFailure {
    destination: Address
}
