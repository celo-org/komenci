import { Test, TestingModule } from '@nestjs/testing';
import { CaptchaService } from './captcha.service';
import { AppModule } from '../../app.module';

describe('CaptchaService', () => {
  let service: CaptchaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [CaptchaService],
    }).compile();

    service = module.get<CaptchaService>(CaptchaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
