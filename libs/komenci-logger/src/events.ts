import { Address, Result } from '@celo/base'
import { RawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'

export enum EventType {
  // Onboarding service events:
  RelayerProxyInit = 'RelayerProxyInit',
  SessionStart = 'SessionStart',
  SessionStartFailure = 'SessionStartFailure',
  DeployWalletTxSent = 'DeployWalletTxSent',
  PepperRequested = 'PepperRequested',
  AttestationsRequested = 'AttestationsRequested',
  MetaTransactionSubmitted = 'MetaTransactionSubmitted',
  ChildMetaTransactionSubmitted = 'ChildMetaTransactionSubmitted',
  // Relayer service events:
  RelayerMTWInit = 'RelayerMTWInit',
  TxSubmitted = 'TxSubmitted',
  TxConfirmed = 'TxConfirmed',
  TxTimeout = 'TxTimeout',
  RuleVerified = 'RuleVerified',
  RelayerBalance = 'RelayerBalance',
  GasPriceUpdate = 'GasPriceUpdate',
}

export type EventPayload = {
  // Onboarding service events payloads:
  [EventType.RelayerProxyInit]: {
    host: string,
    port: number
  }
  [EventType.SessionStart]: SessionEvent
  [EventType.SessionStartFailure]: SessionEvent
  [EventType.RuleVerified]: AccountEvent & {
    ruleId: string
    result: boolean
  }
  [EventType.DeployWalletTxSent]: SessionEvent & {
    txHash: string
  }
  [EventType.PepperRequested]: SessionEvent & RelayerEvent & {
    blindedPhoneNumber: string
    clientVersion: string
  }
  [EventType.AttestationsRequested]: SessionTxEvent & {
    attestationsRequested: number
    identifier: string
  }
  [EventType.MetaTransactionSubmitted]: SessionTxEvent & {
    destination: Address
    childTxsCount: number
  }
  [EventType.ChildMetaTransactionSubmitted]: SessionTxEvent & {
    destination: Address
    value: string,
    methodId: string,
    methodName: string,
    contractName: string
  }
  // Relayer service events payloads:
  [EventType.RelayerMTWInit]: {
    mtwAddress: string
  }
  [EventType.TxSubmitted]: TxEvent & {
    lockAcquiredDuration: number,
    sendDuration: number,
  }
  [EventType.TxConfirmed]: TxEvent & {
    status: string
    gasPrice: number
    gasUsed: number
    gasCost: number
  }
  [EventType.RelayerBalance]: {
    cUSD: number
    celo: number
  }
  [EventType.TxTimeout]: TxEvent & {
    deadLetterHash: string,
    nonce: number
  },
  [EventType.GasPriceUpdate]: {
    gasPriceGwei: number
    cappedAtMax: boolean
  }
}

export type AccountEvent = {
  externalAccount: Address
}

export type SessionEvent = AccountEvent & {
  sessionId: string
}

export type RelayerEvent = {
  relayerAddress: Address
}

export type TxEvent = {
  destination: Address,
  txHash: string,
  nonce: number
}

export type SessionTxEvent = SessionEvent & {
  relayerAddress: Address
  txHash: string
}


