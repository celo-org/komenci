import { Ok, RootError } from '@celo/base/lib/result';
import { Injectable } from '@nestjs/common';
import { Rule } from './rule';

interface DailyCapConfig {
  total: number;
}

export enum DailyCapRuleErrorTypes {
  CapReached = 'CapReached',
}

export class CapReachedError extends RootError<DailyCapRuleErrorTypes> {
  constructor() {
    super(DailyCapRuleErrorTypes.CapReached);
  }
}

@Injectable()
export class DailyCapRule implements Rule<DailyCapConfig, CapReachedError> {
  getID() {
    return 'DailyCapRule';
  }

  async verify(startSessionDto, config, context) {
    return Ok(true);
  }

  validateConfig(config: unknown): DailyCapConfig {
    // Check should happen via io-ts runtime types
    return config as DailyCapConfig;
  }

  defaultConfig(): DailyCapConfig {
    return {
      total: 100,
    };
  }
}
