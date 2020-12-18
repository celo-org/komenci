import { Address } from '@celo/base'

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
  TxDeadletter = 'TxDeadletter',
  TxSpeedUp = 'TxSpeedUp',
  RuleVerified = 'RuleVerified',
  RelayerBalance = 'RelayerBalance',
  GasPriceUpdate = 'GasPriceUpdate',
  // Rewards service events:
  UnexpectedError = 'UnexpectedError',
  EscrowWithdrawalEventsFetched = 'EscrowWithdrawalEventsFetched',
  InviteRewardCreated = 'InviteRewardCreated',
  InviteNotRewarded = 'InviteNotRewarded',
  RewardSendingStatus = 'RewardSendingStatus',
  RelayerSendingError = 'RelayerSendingError',
  AttestationEventsFetched = 'AttestationEventsFetched',
  AttestationCompleted = 'AttestationCompleted',
  // Funder Service events
  FundBalance = 'FundBalance',
  NoRelayersToFund = 'NoRelayersToFund',
  CeloTopUp = 'CeloTopUp',
  CUSDTopUp = 'CUSDTopUp',
  InsufficientCelo = 'InsufficientCelo',
  InsufficientCUSD = 'InsufficientCUSD'
}

export type EventPayload = {
  // Onboarding service events payloads:
  [EventType.RelayerProxyInit]: {
    host: string
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
  [EventType.PepperRequested]: SessionEvent &
    RelayerEvent & {
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
    value: string
    methodId: string
    methodName: string
    contractName: string
  }
  // Relayer service events payloads:
  [EventType.RelayerMTWInit]: {
    mtwAddress: string
  }
  [EventType.TxSubmitted]: TxEvent & {
    gasPrice: string
    lockAcquiredDuration: number
    sendDuration: number
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
  [EventType.TxDeadletter]: TxEvent & {
    reason: string
    deadLetterHash: string
  }
  [EventType.TxSpeedUp]: TxEvent & {
    prevTxHash: string
  }
  [EventType.GasPriceUpdate]: {
    gasPriceGwei: number
    cappedAtMax: boolean
  }
  // Reward service events payloads
  [EventType.UnexpectedError]: {
    origin: string
    error: string
  }
  [EventType.EscrowWithdrawalEventsFetched]: {
    eventCount: number
    fromBlock: number
  }
  [EventType.InviteRewardCreated]: {
    txHash: string
    inviteId: string
    inviter: string
    invitee: string
  }
  [EventType.InviteNotRewarded]: {
    txHash: string
    inviter: string
    invitee: string | null
    reason: InviteNotRewardedReason
  }
  [EventType.RewardSendingStatus]: {
    status: RewardSendingStatus
    txHash: string | null
    inviteId: string
  }
  [EventType.RelayerSendingError]: {
    inviteId: string
    error: string
  }
  [EventType.AttestationEventsFetched]: {
    eventCount: number
    fromBlock: number
  }
  [EventType.AttestationCompleted]: {
    txHash: string
    issuer: string
    address: string
    identifier: string
  },
  [EventType.FundBalance]: {
    cUSD: number
    celo: number
  },
  [EventType.NoRelayersToFund]: {},
  [EventType.CeloTopUp]: {
    celoPerRelayer: number
    totalCelo: number
    relayerAddresses: Address[]
  },
  [EventType.CUSDTopUp]: {
    cUSDPerRelayer: number
    totalCUSD: number
    relayerAddresses: Address[]
  },
  [EventType.InsufficientCelo]: {
    fundCelo: number
    requiredCelo: number
  },
  [EventType.InsufficientCUSD]: {
    fundCUSD: number
    requiredCUSD: number
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
  destination: Address
  txHash: string
  nonce: number
}

export type SessionTxEvent = SessionEvent & {
  relayerAddress: Address
  txHash: string
}

export enum InviteNotRewardedReason {
  NotCusdInvite = 'NotCusdInvite',
  NotKomenciRedeem = 'NotKomenciRedeem',
  NoInviteeFound = 'NoInviteeFound',
  InviterNotVerified = 'InviterNotVerified',
  InviteeNotVerified = 'InviteeNotVerified',
  InviterReachedWeeklyLimit = 'InviterReachedWeeklyLimit',
  InviteeAlreadyInvited = 'InviteeAlreadyInvited'
}

export enum RewardSendingStatus {
  Submitted = 'Submitted',
  Completed = 'Completed',
  Failed = 'Failed',
  DeadLettered = 'DeadLettered'
}
