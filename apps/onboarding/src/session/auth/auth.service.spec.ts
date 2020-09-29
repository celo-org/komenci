import { JwtModule } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { SessionService } from '../session.service'
import { AuthService } from './auth.service'

describe('AuthService', () => {
  let service: AuthService
  const mockSessionService = {
    createSession: jest.fn(),
    findByAccount: jest.fn(),
    findOne: jest.fn()
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'secret12356789',
        })
      ],
      providers: [
        {
          provide: SessionService,
          useValue: mockSessionService
        },
        AuthService,
      ]
    }).compile()
    
    service = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

})
