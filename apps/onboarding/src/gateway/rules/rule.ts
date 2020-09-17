import { Result, RootError } from '@celo/base/lib/result';
import { FastifyRequest } from 'fastify';
import { StartSessionDto } from '../../dto/StartSessionDto'

export interface GatewayContext {
  req: FastifyRequest
}

export interface Rule<TRuleConfig, TErrorTypes extends Error> {
  getID(): string
  verify(
    payload: Partial<StartSessionDto>,
    config: TRuleConfig,
    context: GatewayContext
  ): Promise<Result<boolean, TErrorTypes>>
  validateConfig(config: unknown): TRuleConfig
  defaultConfig(): TRuleConfig
}

