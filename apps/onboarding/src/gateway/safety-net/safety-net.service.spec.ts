import thirdPartyConfig from '@app/onboarding/config/third-party.config'
import { HttpModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { SafetyNetService } from './safety-net.service'

describe('SafetyNetService', () => {
  let service: SafetyNetService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [thirdPartyConfig],
          envFilePath: ['apps/onboarding/.env.test']
        }),
        HttpModule
      ],
      providers: [SafetyNetService]
    }).compile()

    service = module.get<SafetyNetService>(SafetyNetService)
  })

  it('should be true when the attestation is valid', async () => {
    const result = { isValidSignature: true }
    jest.spyOn(service, 'verifyDevice').mockImplementation(async () => result)

    expect(
      (await service.verifyDevice({ signedAttestation: 'valid' }))
        .isValidSignature
    ).toBe(true)
  })

  it('should be false when the attestation is invalid', async () => {
    const result = { isValidSignature: false }
    jest.spyOn(service, 'verifyDevice').mockImplementation(async () => result)

    expect(
      (await service.verifyDevice({ signedAttestation: 'invalid' }))
        .isValidSignature
    ).toBe(false)
  })
})
