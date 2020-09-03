import { Test, TestingModule } from '@nestjs/testing';
import { DeviceCheckService } from 'apps/onboarding/src/gateway/device-check/device-check.service';

describe('DeviceCheckService', () => {
  let service: DeviceCheckService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeviceCheckService],
    }).compile();

    service = module.get<DeviceCheckService>(DeviceCheckService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
