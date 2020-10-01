import { SessionService } from '@app/onboarding/session/session.service'
import { Post } from '@nestjs/common'
import { JwtModule, JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { AppController } from './app.controller'
import { AppModule } from './app.module'
import { AppService } from './app.service'
import { AuthService } from './auth/auth.service'
import { StartSessionDto } from './dto/StartSessionDto'
import { GatewayService } from './gateway/gateway.service'
import { RelayerProxyService } from './relayer_proxy.service'

describe('AppController', () => {
  let appController: AppController
  const gatewayMock = {
    verify: jest.fn()
  }
  const authMock = {
    access: jest.fn()
  }
  const jwtMock = {
    verify: jest.fn()
  }
  const relayerMock = {
    getPhoneNumberIdentifier: jest.fn(),
    submitTransaction: jest.fn(),
  }
  const sessionMock = {

  }

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'secret123456789',
      })
    ],
      controllers: [AppController],
      providers: [
        AppService, RelayerProxyService, JwtService,
        AuthService, GatewayService, SessionService
      ]
    })
    .overrideProvider(GatewayService).useValue(gatewayMock)
    .overrideProvider(AuthService).useValue(authMock)
    .overrideProvider(JwtService).useValue(jwtMock)
    .overrideProvider(RelayerProxyService).useValue(relayerMock)
    .overrideProvider(SessionService).useValue(sessionMock)
    .compile()

    appController = app.get<AppController>(AppController)
  })

  describe('root', () => {
    it('should be defined', () => {
      expect(appController).toBeDefined()
    })

    xit('should return a valid session',async () => {
      const session = {captchaResponseToken:"xx", deviceType: "ios", iosDeviceToken:"pp", externalAccount:"0x1234vfyuik"}

      jest.spyOn(appController, 'startSession').mockResolvedValue({
        token: 'accessToken',
     })

      expect(await appController.startSession(session as StartSessionDto, Post)).toEqual({
        token: 'accessToken',
     })
    })

    xit('should return a valid session',async () => {
      const session = {}

      // jest.spyOn(appController, 'startSession').mockResolvedValue({ error: 'gateway-not-passed' })
      // expect(await appController.startSession(session as StartSessionDto, Post)).toEqual({ error: 'gateway-not-passed' })
    })
  })
})
