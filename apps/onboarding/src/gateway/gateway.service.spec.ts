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

  xit('should enable the rules depending on env variables', async () => {
    process.env.RULE_DAILY_CAP_ENABLED = ''
    await service.onModuleInit()
    expect((service as any).ruleEnabled).toEqual(expect.objectContaining({DAILY_CAP: false}))

    process.env.RULE_DAILY_CAP_ENABLED = 'true'
    await service.onModuleInit()
    expect((service as any).ruleEnabled).toEqual(expect.objectContaining({DAILY_CAP: true}))
  })

  xit('should set the rules config depending on env variables', async () => {
    process.env.RULE_CAPTCHA_CONFIG = ''
    await service.onModuleInit()
    expect((service as any).ruleConfigs).toEqual(expect.objectContaining({CAPTCHA: null}))

    process.env.RULE_CAPTCHA_CONFIG = '{"test": true}'
    await service.onModuleInit()
    expect((service as any).ruleConfigs).toEqual(expect.objectContaining({CAPTCHA: {test: true}}))
  })
})
