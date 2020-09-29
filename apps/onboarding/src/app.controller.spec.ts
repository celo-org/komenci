import { JwtModule, JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { AppController } from './app.controller'
import { AppModule } from './app.module'
import { AppService } from './app.service'
import { GatewayService } from './gateway/gateway.service'
import { RelayerProxyService } from './relayer_proxy.service'
import { AuthModule } from './session/auth/auth.module'
import { AuthService } from './session/auth/auth.service'

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

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'secret123456789',
      })
    ],
      controllers: [AppController],
      providers: [AppService]
    })
    .overrideProvider(GatewayService).useValue(gatewayMock)
    .overrideProvider(AuthService).useValue(authMock)
    .overrideProvider(JwtService).useValue(jwtMock)
    .overrideProvider(RelayerProxyService).useValue(relayerMock)
    .compile()

    appController = app.get<AppController>(AppController)
  })

  describe('root', () => {
    it('should be defined', () => {
      expect(appController).toBeDefined()
    })

    // it('should return a valid session', () => {
    //   expect(appController.startSession({} as any,{})).toBe({ error: 'gateway-not-passed' })
    // })
  })
})
