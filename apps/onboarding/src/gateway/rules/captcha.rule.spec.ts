import { HttpModule } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CaptchaRule } from './captcha.rule';
import { CaptchaService } from '../captcha/captcha.service';
import { AppModule } from '../../app.module';

describe('CaptchaRule', () => {
  let service: CaptchaRule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule, HttpModule],
      providers: [CaptchaRule, CaptchaService],
    }).compile();

    service = module.get<CaptchaRule>(CaptchaRule);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have the correct id', () => {
    expect(service.getID()).toBe('CaptchaRule');
  });

  it('should verify the token', async() => {
    const captchaServiceSpy = spyOn((service as any).captchaService, 'verifyCaptcha')
      .and.returnValue({success: true})

    expect(await service.verify({captchaResponse: 'token-test'}, undefined, undefined)).toBeTruthy()

    expect(captchaServiceSpy).toHaveBeenCalledWith({token: 'token-test'})
  });
});
