import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthService } from 'apps/onboarding/src/auth/auth.service'
import { JwtStrategy } from 'apps/onboarding/src/auth/jwt.strategy'
import { AppConfig } from 'apps/onboarding/src/config/app.config'
import { SessionModule } from 'apps/onboarding/src/session/session.module'
import { SessionService } from 'apps/onboarding/src/session/session.service'

@Module({
    imports: [
      PassportModule.register({
        defaultStrategy: 'jwt',
        property: 'session',
      }),
      JwtModule.registerAsync({
        useFactory: async (config: ConfigService) => ({
          signOptions: {},
          secret: config.get<AppConfig>('app').jwt_secret,
        }),
        inject: [ConfigService],
      }),
      SessionModule,
    ],
    providers: [AuthService, JwtStrategy, SessionService],
    exports: [AuthService, PassportModule]
})
export class AuthModule { }