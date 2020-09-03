import { FastifyRequest } from 'fastify';

export interface GatewayContext {
  // XXX TODO
  todo: string
}

export interface Rule<TRuleConfig, TError> {
  verify(req: FastifyRequest, config: TRuleConfig, context: GatewayContext): Promise<boolean>
  getID(): string
}

