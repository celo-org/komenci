import { Injectable } from '@nestjs/common';
import { Rule } from 'apps/onboarding/src/gateway/rule';

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
}