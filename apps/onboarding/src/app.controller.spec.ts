import { Test, TestingModule } from '@nestjs/testing'
import { AppController } from './app.controller'
import { AppModule } from './app.module'
import { AppService } from './app.service'
import { GatewayService } from './gateway/gateway.service'

describe('AppController', () => {
  let appController: AppController
  const gatewayMock = {
    verify: jest.fn(() => false)
  }

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [AppController],
      providers: [AppService]
    })
    .overrideProvider(GatewayService)
    .useValue(gatewayMock)
    .compile()

    appController = app.get<AppController>(AppController)
  })

  xdescribe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.startSession({} as any,{})).toBe('Hello World!')
    })
  })
})
