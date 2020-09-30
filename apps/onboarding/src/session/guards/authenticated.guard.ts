import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
@Injectable()
export class AuthenticatedGuard implements CanActivate {
  constructor(
    private jwtService: JwtService
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest()
    try {
      if(this.jwtService.verify(request.headers.authorization)) {
        return true
      }
    }catch {
      return false
    }
  }
}
