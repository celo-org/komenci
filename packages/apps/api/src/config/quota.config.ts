import { ConfigType, registerAs } from '@nestjs/config'
import { numberFromEnv } from './utils'

export enum TrackedAction {
  DistributedBlindedPepper = 'distributedBlindedPepper',
  RequestSubsidisedAttestation = 'requestSubsidisedAttestation',
  SubmitMetaTransaction = 'submitMetaTransaction',
}

export type ActionCounts = {[action in TrackedAction]?: number}

export const quotaConfig = registerAs<() => ActionCounts>('quota', () => ({
  [TrackedAction.DistributedBlindedPepper]:
    numberFromEnv('QUOTA_DISTRIBUTED_BLINDED_PEPPER', 1),
  [TrackedAction.RequestSubsidisedAttestation]:
    numberFromEnv('QUOTA_REQUEST_SUBSIDISED_ATTESTATION', 10),
  [TrackedAction.SubmitMetaTransaction]:
    numberFromEnv('QUOTA_SUBMIT_META_TRANSACTION', 20),
}))

export type QuotaConfig = ConfigType<typeof quotaConfig>
