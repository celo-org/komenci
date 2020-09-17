import { Injectable } from '@nestjs/common';
import { Failed, Rule } from './rule';

interface DailyCapConfig {
  total: number
}

@Injectable()
export class DailyCapRule implements Rule<DailyCapConfig, string> {
  getID() {
    return "DailyCapRule"
  }

  async verify(req, config, context) {
    return Failed("cap-reached")
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