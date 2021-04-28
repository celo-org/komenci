import { ApiError } from '@app/komenci-logger/errors'
import { quotaConfig, TrackedAction } from '@app/onboarding/config/quota.config'
import { Session } from '@app/onboarding/session/session.entity'
import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { Reflector } from '@nestjs/core'

class QuotaExceededError extends ApiError<'QuotaExceededError'> {
  statusCode = 429
  metadataProps = ['action']

  constructor(readonly action: TrackedAction) {
    super('QuotaExceededError')
    this.message = `Quota exceeded on ${action}`
  }
}

@Injectable()
export class QuotaGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(quotaConfig.KEY)
    private config: ConfigType<typeof quotaConfig>,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const action = this.reflector.get<TrackedAction>('trackedAction', context.getHandler())
    if (!action) {
      return true
    }
    const request = context.switchToHttp().getRequest()
    const session = request.session as Session
    const usage = session.getActionCount(action)
    if (usage >= this.config[action]) {
      throw new QuotaExceededError(action)
    }
    return true
  }
}