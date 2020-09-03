import { FastifyRequest } from 'fastify';

export interface GatewayContext {
  // XXX TODO
  todo: string
}

export interface Rule<TRuleConfig, TError> {
  getID(): string
  verify(req: FastifyRequest, config: TRuleConfig, context: GatewayContext): Promise<boolean>
  validateConfig(config: unknown): TRuleConfig
  defaultConfig(): TRuleConfig
}

