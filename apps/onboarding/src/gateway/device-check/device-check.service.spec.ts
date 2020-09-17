import { Test, TestingModule } from '@nestjs/testing'
import { AppModule } from '../../app.module'
import { DeviceCheckService } from './device-check.service'

describe('DeviceCheckService', () => {
  let service: DeviceCheckService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [DeviceCheckService]
    }).compile()

    service = module.get<DeviceCheckService>(DeviceCheckService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
