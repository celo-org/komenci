import { TrackedAction } from '@app/onboarding/config/quota.config'
import { SetMetadata } from '@nestjs/common'

export const QuotaAction = (action: TrackedAction) => SetMetadata('trackedAction', action)

