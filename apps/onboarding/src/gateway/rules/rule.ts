import { FastifyRequest } from 'fastify';
import { StartSessionDto } from '../../dto/StartSessionDto'

export interface GatewayContext {
  req: FastifyRequest
}

export interface RulePassed {
  passed: true
}

export interface RuleFailed<TReason> {
  passed: false
  reasons: TReason[]
}

export type RuleResult<TReason> = RulePassed | RuleFailed<TReason>

export const Passed = (): RulePassed => ({passed: true})
export const Failed = <TReason>(...reasons: TReason[]): RuleFailed<TReason> => ({passed: false, reasons})

export interface Rule<TRuleConfig, TReason> {
  getID(): string
  verify(startSessionDto: StartSessionDto, req: FastifyRequest, config: TRuleConfig, context: GatewayContext): Promise<RuleResult<TReason>>
  validateConfig(config: unknown): TRuleConfig
  defaultConfig(): TRuleConfig
}

