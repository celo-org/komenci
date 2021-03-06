import { Result } from '@celo/base/lib/result'
import { FastifyRequest } from 'fastify'
import { StartSessionDto } from '../../dto/StartSessionDto'

export enum RuleID {
  DailyCap = 'DAILY_CAP',
  Captcha = 'CAPTCHA',
  DeviceAttestation = 'DEVICE_ATTESTATION',
  Signature = 'SIGNATURE'
}

export interface GatewayContext {
  req: FastifyRequest
}

export interface Rule<TRuleConfig, TErrorTypes extends Error> {
  getID(): RuleID
  verify(
    payload: Partial<StartSessionDto>,
    config: TRuleConfig,
    context: GatewayContext
  ): Promise<Result<boolean, TErrorTypes>>
}
