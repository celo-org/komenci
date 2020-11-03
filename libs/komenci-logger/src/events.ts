import { Address, Result } from '@celo/base'

export interface KomenciEvent {
    sessionId?: string
    externalAccount: Address
}

export interface TxEvent {
    relayerAddress: Address
    destination: Address
    txHash: string
    gasPrice: number
    gasUsed: number
    gasCost: number
}

export interface RuleVerified {
    ruleId: string
    metaData?: Record<string, unknown>
    result: Result<boolean, any>
}

export interface WalletDeployed extends KomenciEvent {
    txHash: string
}

export interface PepperRequested {
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