import { KomenciLoggerService } from '@app/komenci-logger'
import { HttpModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { DeviceCheckService } from 'apps/onboarding/src/gateway/device-check/device-check.service'
import { RuleID } from 'apps/onboarding/src/gateway/rules/rule'
import { SafetyNetService } from 'apps/onboarding/src/gateway/safety-net/safety-net.service'
import { Logger, LoggerModule } from 'nestjs-pino'
import { rulesConfig, RulesConfig } from '../config/rules.config'
import { thirdPartyConfig } from '../config/third-party.config'
import { CaptchaService } from './captcha/captcha.service'
import { GatewayService } from './gateway.service'

jest.mock('@app/komenci-logger/komenci-logger.service')

describe('GatewayService', () => {
  describe("by changing the env", () => {
    const buildTestingModule = async (): Promise<TestingModule> => {
      return Test.createTestingModule({
        imports: [
          LoggerModule.forRoot(),
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
          KomenciLoggerService
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
      process.env.RULE_DAILY_CAP_CONFIG = '{"test": true}'
      const module = await buildTestingModule()
      const service = module.get<GatewayService>(GatewayService)
      await service.onModuleInit()
      expect((service as any).ruleConfigs).toEqual(expect.objectContaining({DAILY_CAP: {test: true}}))
    })
  })

  describe("by changing the provider config", () => {
    const buildTestingModuleForConfig = async (config: RulesConfig): Promise<TestingModule> => {
      return Test.createTestingModule({
        imports: [
          LoggerModule.forRoot(),
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
          KomenciLoggerService
        ]
      }).overrideProvider(rulesConfig.KEY).useValue(config).compile()
    }

    it('should be defined', async () => {
      const module = await buildTestingModuleForConfig({enabled: {}, configs: {}})
      const service = module.get<GatewayService>(GatewayService)
      expect(service).toBeDefined()
    })

    it('should disable the rules depending on env variables when empty', async () => {
      const module = await buildTestingModuleForConfig({
        configs: {},
        enabled: {
          [RuleID.DailyCap]: false
        }
      })
      const service = module.get<GatewayService>(GatewayService)
      await service.onModuleInit()
      expect((service as any).ruleEnabled).toEqual(expect.objectContaining({ DAILY_CAP: false }))
    })

    it('should enable the rules depending on env variables when true', async () => {
      const module = await buildTestingModuleForConfig({
        configs: {},
        enabled: {
          [RuleID.DailyCap]: true
        }
      })
      const service = module.get<GatewayService>(GatewayService)
      await service.onModuleInit()
      expect((service as any).ruleEnabled).toEqual(expect.objectContaining({DAILY_CAP: true}))
    })

    it('should set the rules config depending on env variables when empty', async () => {
      const module = await buildTestingModuleForConfig({
        enabled: {},
        configs: {
          [RuleID.Captcha]: null
        }
      })
      const service = module.get<GatewayService>(GatewayService)
      await service.onModuleInit()
      expect((service as any).ruleConfigs).toEqual(expect.objectContaining({CAPTCHA: null}))
    })

    it('should set the rules config depending on env variables when valid', async () => {
      const module = await buildTestingModuleForConfig({
        enabled: {},
        configs: {
          [RuleID.DailyCap]: '{"test": true}'
        }
      })
      const service = module.get<GatewayService>(GatewayService)
      await service.onModuleInit()
      expect((service as any).ruleConfigs).toEqual(expect.objectContaining({DAILY_CAP: {test: true}}))
    })
  })

})
