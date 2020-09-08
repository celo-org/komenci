import { Test, TestingModule } from '@nestjs/testing';
import { SafetyNetService } from './safety-net.service';
import { AppModule } from '../../app.module';

describe('SafetyNetService', () => {
  let service: SafetyNetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [SafetyNetService],
    }).compile();

    service = module.get<SafetyNetService>(SafetyNetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
