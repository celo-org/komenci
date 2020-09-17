import { Ok } from '@celo/base/lib/result';
import { HttpModule } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Passed } from 'apps/onboarding/src/gateway/rules/rule';
import { CaptchaRule } from './captcha.rule';
import { CaptchaService } from '../captcha/captcha.service';
import { AppModule } from '../../app.module';

describe('CaptchaRule', () => {
  let rule: CaptchaRule;
  const captchaServiceMock = {
    verifyCaptcha: jest.fn()
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [CaptchaRule, CaptchaService],
    }).overrideProvider(CaptchaService).useValue(captchaServiceMock).compile();

    rule = module.get<CaptchaRule>(CaptchaRule);
  });

  it('should be defined', () => {
    expect(rule).toBeDefined();
  });

  it('should have the correct id', () => {
    expect(rule.getID()).toBe('CaptchaRule');
  });

  it('should verify the token', async() => {
    captchaServiceMock.verifyCaptcha.mockReturnValue(Ok(true))
    expect(
      await rule.verify({captchaResponse: 'token-test'}, undefined, undefined)
    ).toStrictEqual(Passed())
    expect(captchaServiceMock.verifyCaptcha).toHaveBeenCalledWith({token: 'token-test'})
  });
});
