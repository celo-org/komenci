import { Injectable } from '@nestjs/common';
import { Rule } from './rule';

interface DailyCapConfig {
  total: number
}

@Injectable()
export class DailyCapRule implements Rule<DailyCapConfig, any> {
  getID() {
    return "DailyCapRule"
  }

  async verify(req, config, context) {
    return true
  }

  validateConfig(config: unknown): DailyCapConfig {
    // Check should happen via io-ts runtime types
    return config as DailyCapConfig;
  }

  defaultConfig(): DailyCapConfig {
    return {
      total: 100
    }
  }
}