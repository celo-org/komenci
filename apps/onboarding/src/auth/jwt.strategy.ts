import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { AuthService } from 'apps/onboarding/src/auth/auth.service'
import { AppConfig } from 'apps/onboarding/src/config/app.config'
import { Session } from 'apps/onboarding/src/session/session.entity'
import { ExtractJwt, Strategy } from 'passport-jwt'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    protected configService: ConfigService,
    protected authService: AuthService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: configService.get<AppConfig>('app').jwt_secret,
    })
  }

  async validate(payload: unknown): Promise<Session> {
    debugger
    return this.authService.recoverSession(payload)
  }
}