import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Session } from '../session.entity'
import { SessionModule } from '../session.module'
import { SessionService } from '../session.service'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './jwt.strategy'

@Module({
    imports: [TypeOrmModule.forFeature([Session]),
    PassportModule.register({
        defaultStrategy: 'jwt',
        property: 'session',
        session: false
      }),
    JwtModule.register({
        secret: 'secret123456789',
    }),
    ],
    providers: [SessionService, AuthService, JwtStrategy],
    controllers: [AuthController],
    exports: [PassportModule, AuthService]
})
export class AuthModule { }