import { ConfigType, registerAs } from '@nestjs/config'

export enum TrackedAction {
  DistributedBlindedPepper = 'distributedBlindedPepper',
  RequestSubsidisedAttestation = 'requestSubsidisedAttestation',
  SubmitMetaTransaction = 'submitMetaTransaction',
}

export type ActionCounts = {[action in TrackedAction]?: number}

const parseNumber = (
  key: string,
  defaultValue: number
) => {
  const rawValue = process.env[key]
  return rawValue && !isNaN(+rawValue)
    ? +rawValue
    : defaultValue
}

export const quotaConfig = registerAs<() => ActionCounts>('quota', () => ({
  [TrackedAction.DistributedBlindedPepper]:
    parseNumber('QUOTA_DISTRIBUTED_BLINDED_PEPPER', 1),
  [TrackedAction.RequestSubsidisedAttestation]:
    parseNumber('QUOTA_REQUEST_SUBSIDISED_ATTESTATION', 10),
  [TrackedAction.SubmitMetaTransaction]:
    parseNumber('QUOTA_SUBMIT_META_TRANSACTION', 20),
}))

export type QuotaConfig = ConfigType<typeof quotaConfig>
