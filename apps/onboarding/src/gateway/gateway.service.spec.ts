import { Test, TestingModule } from '@nestjs/testing'
import { HttpModule, HttpService } from '@nestjs/common'
import { GatewayService } from './gateway.service'
import { AppModule } from '../app.module'
import { CaptchaService } from './captcha/captcha.service'

describe('GatewayService', () => {
  let service: GatewayService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule, AppModule],
      providers: [GatewayService, CaptchaService]
    }).compile()

    service = module.get<GatewayService>(GatewayService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
