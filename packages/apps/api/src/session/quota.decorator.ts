import { SetMetadata } from '@nestjs/common'
import { TrackedAction } from '../config/quota.config'

export const QuotaAction = (action: TrackedAction) => SetMetadata('trackedAction', action)

