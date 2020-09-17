import { HttpModule } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { AppModule } from '../../app.module'
import { DeviceCheckService } from './device-check.service'

describe('DeviceCheckService', () => {
  let service: DeviceCheckService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule, HttpModule],
      providers: [DeviceCheckService],
    }).compile()

    service = module.get<DeviceCheckService>(DeviceCheckService)
  })

  it('should be true when the attestation is valid', async() => {
    const result = true
    jest.spyOn(service, 'verifyDevice').mockImplementation(async () => result)

    expect((await service.verifyDevice({deviceToken:"valid"}))).toBe(true)
  })

  it('should be false when the attestation is invalid', async () => {
    const result = false
    jest.spyOn(service, 'verifyDevice').mockImplementation(async () => result)

    expect((await service.verifyDevice({deviceToken:"invalid"}))).toBe(false)
  })
})