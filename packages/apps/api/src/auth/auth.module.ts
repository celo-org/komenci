import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AppConfig } from '../config/app.config'
import { SessionModule } from '../session/session.module'
import { SessionService } from '../session/session.service'
import { AuthService } from './auth.service'
import { JwtStrategy } from './jwt.strategy'

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