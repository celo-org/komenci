import { StartSessionDto } from '../../dto/StartSessionDto'

export interface GatewayContext {
  // XXX TODO
  todo: string
}

export interface Rule<TRuleConfig, TError> {
  getID(): string
  verify(startSessionDto: StartSessionDto, config: TRuleConfig, context: GatewayContext): Promise<boolean>
  validateConfig(config: unknown): TRuleConfig
  defaultConfig(): TRuleConfig
}

