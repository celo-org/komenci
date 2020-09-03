import { Test, TestingModule } from '@nestjs/testing';
import { SafetyNetService } from 'apps/onboarding/src/gateway/safety-net/safety-net.service';

describe('SafetyNetService', () => {
  let service: SafetyNetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SafetyNetService],
    }).compile();

    service = module.get<SafetyNetService>(SafetyNetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
