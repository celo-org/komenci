import { Ok, RootError } from '@celo/base/lib/result'
import { Injectable } from '@nestjs/common'
import { Rule, RuleID } from './rule'

interface DailyCapConfig {
  total: number
}

export enum DailyCapRuleErrorTypes {
  CapReached = 'CapReached'
}

export class CapReachedError extends RootError<DailyCapRuleErrorTypes> {
  constructor() {
    super(DailyCapRuleErrorTypes.CapReached)
  }
}

@Injectable()
export class DailyCapRule implements Rule<DailyCapConfig, CapReachedError> {
  getID() {
    return RuleID.DailyCap
  }

  async verify(startSessionDto, config, context) {
    return Ok(true)
  }

  validateConfig(config: string = 'null'): DailyCapConfig {
    return JSON.parse(config) || null as DailyCapConfig
  }

  defaultConfig(): DailyCapConfig {
    return {
      total: 100
    }
  }
}
