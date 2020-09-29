import { HttpModule, HttpService } from '@nestjs/common'
import { ConfigModule, ConfigType } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing'
import { DeviceCheckService } from 'apps/onboarding/src/gateway/device-check/device-check.service';
import { RuleID } from 'apps/onboarding/src/gateway/rules/rule';
import { SafetyNetService } from 'apps/onboarding/src/gateway/safety-net/safety-net.service';
import appConfig from 'apps/relayer/src/config/app.config';
import rulesConfig from '../config/rules.config'
import thirdPartyConfig from '../config/third-party.config'
import { CaptchaService } from './captcha/captcha.service'
import { GatewayService } from './gateway.service'

describe('GatewayService', () => {

  const buildTestingModule = async (): Promise<TestingModule> => {
    return Test.createTestingModule({
      imports: [
        HttpModule,
        ConfigModule.forRoot({
          load: [thirdPartyConfig, rulesConfig],
        })
      ],
      providers: [
        GatewayService,
        CaptchaService,
        DeviceCheckService,
        SafetyNetService,
      ]
    }).compile()
  }

  it('should be defined', async () => {
    const module = await buildTestingModule()
    const service = module.get<GatewayService>(GatewayService)
    expect(service).toBeDefined()
  })

  it('should disable the rules depending on env variables when empty', async () => {
    process.env.RULE_DAILY_CAP_ENABLED = ''
    const module = await buildTestingModule()
    const service = module.get<GatewayService>(GatewayService)
    await service.onModuleInit()
    expect((service as any).ruleEnabled).toEqual(expect.objectContaining({ DAILY_CAP: false }))
  })

  it('should enable the rules depending on env variables when true', async () => {
    process.env.RULE_DAILY_CAP_ENABLED = 'true'
    const module = await buildTestingModule()
    const service = module.get<GatewayService>(GatewayService)
    await service.onModuleInit()
    expect((service as any).ruleEnabled).toEqual(expect.objectContaining({DAILY_CAP: true}))
  })

  it('should set the rules config depending on env variables when empty', async () => {
    process.env.RULE_CAPTCHA_CONFIG = ''
    const module = await buildTestingModule()
    const service = module.get<GatewayService>(GatewayService)
    await service.onModuleInit()
    expect((service as any).ruleConfigs).toEqual(expect.objectContaining({ CAPTCHA: null }))
  })

  it('should set the rules config depending on env variables when valid', async () => {
    process.env.RULE_CAPTCHA_CONFIG = '{"test": true}'
    const module = await buildTestingModule()
    const service = module.get<GatewayService>(GatewayService)
    await service.onModuleInit()
    expect((service as any).ruleConfigs).toEqual(expect.objectContaining({CAPTCHA: {test: true}}))
  })
})
