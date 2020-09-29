import { JwtModule, JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { Session } from '../session.entity'
import { SessionService } from '../session.service'
import { AuthService } from './auth.service'

describe('AuthService', () => {
  let service: AuthService
  let jwtService: JwtService
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
    jwtService = module.get<JwtService>(JwtService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should give access and create a new Session', async () => {
    const result = {status: 200, access_token: 'test'}

    jest.spyOn(service, 'access').mockResolvedValue(result)

    expect(await service.access('test')).toBe(result)
  })

  it('should verify that the access tokens is valid', async () => {
    const accessToken = jwtService.sign('test')

    jest.spyOn(service, 'verify').mockResolvedValue(true)

    expect(await service.verify(accessToken)).toBe(true)
  })

})
