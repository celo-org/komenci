import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'

@Injectable()
export class LoginGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest()
    console.log(request)
    return true
  }
}