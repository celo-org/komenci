import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { AppController } from './app.controller'
import { AppModule } from './app.module'
import { AppService } from './app.service'
import { GatewayService } from './gateway/gateway.service'
import { AuthService } from './session/auth/auth.service'

describe('AppController', () => {
  let appController: AppController
  const gatewayMock = {
    verify: jest.fn(() => false)
  }
  const authMock = {
    access: jest.fn()
  }
  const jwtMock = {
    verify: jest.fn()
  }

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [AppController],
      providers: [AppService]
    })
    .overrideProvider(GatewayService)
    .useValue(gatewayMock)
    .overrideProvider(AuthService)
    .useValue(authMock)
    .overrideProvider(JwtService)
    .useValue(jwtMock)
    .compile()

    appController = app.get<AppController>(AppController)
  })

  describe('root', () => {
    it('should return a valid session', () => {
      expect(appController.startSession({} as any,{})).toBe({ error: 'gateway-not-passed' })
    })
  })
})
