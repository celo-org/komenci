import { JwtModule, JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from 'apps/onboarding/src/auth/auth.service'
import { Session } from 'apps/onboarding/src/session/session.entity'
import { SessionService } from 'apps/onboarding/src/session/session.service'

describe('AuthService', () => {
  let service: AuthService
  let jwtService: JwtService

  const mockSessionService = {
    findOrCreateForAccount: jest.fn(),
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

  describe("#startSession", () => {
    it("should build a valid JWT token with a given session ID", async () => {
      const sessionId = 'test-session-id'
      const session = Session.of({id: sessionId})
      mockSessionService.findOrCreateForAccount.mockResolvedValue(session)
      const token = await service.startSession("0x1234")

      expect(jwtService.verify(token)).toBeTruthy()
      expect(jwtService.decode(token)).toMatchObject({ sessionId })
    })
  })

  describe("#recoverSession", () => {
    const sessionId = 'test-session-id'

    describe('with a valid token payload', () => {
      describe('and an open session', () => {
        it('returns the session', async () => {
          const session = Session.of({id: sessionId})
          mockSessionService.findOne.mockResolvedValue(session)
          const payload = {sessionId}
          const returnedSession = await service.recoverSession(payload)
          expect(returnedSession).toEqual(session)
          expect(mockSessionService.findOne).toBeCalledWith(sessionId)
        })
      })
    })

    describe('with an invalid token payload', () => {
      it('throws an error', async () => {
        const payload = {not: 'really valid'}
        await expect(service.recoverSession(payload)).rejects.toThrow(
          /Invalid or outdated token/
        )
      })
    })
  })
})
