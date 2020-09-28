import { JwtModule, JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import{ Session } from '../session.entity'
import {SessionRepository} from '../session.repository'
import { SessionService } from '../session.service'
import { AuthController } from './auth.controller'
import { AuthModule } from './auth.module'
import { AuthService } from './auth.service'
import { JwtStrategy } from './jwt.strategy'

describe('AuthService', () => {
  let service: AuthService
  let repository: SessionRepository

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule,     
        JwtModule.register({
        secret: 'secret12356789',
        })
      ],
      controllers: [AuthController],
      providers: [SessionService,        {
        provide: getRepositoryToken(Session),
        useClass: Repository,
      },
      AuthService, JwtStrategy]
    }).compile()
    
    repository = module.get<Repository<Session>>(getRepositoryToken(Session))
    service = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

})
