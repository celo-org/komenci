import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { Session } from './session.entity'

export const SessionDecorator = createParamDecorator(
  (data: Session, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    const session = request.session
    return  data ? session && session.completedAt : session
  },
)