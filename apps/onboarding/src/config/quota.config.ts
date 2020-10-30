import { ConfigType, registerAs } from '@nestjs/config'

const useEnv = (env: string, def: number) => env && !isNaN(+env) ? +env : def

export const quotaConfig = registerAs('quota', () => ({
  distributedBlindedPepper: useEnv(process.env.DISTRIBUTED_BLINDED_PEPPER, 1),
  requestSubsidisedAttestation: useEnv(process.env.REQUEST_SUBSIDISED_ATTESTATION, 10),
  submitMetaTransaction: useEnv(process.env.SUBMIT_META_TRANSACTION, 20),
}))

export type QuotaConfig = ConfigType<typeof quotaConfig>
