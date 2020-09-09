import { HttpModule, HttpService } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CaptchaService } from './captcha.service';
import { AppModule } from '../../app.module';

describe('CaptchaService', () => {
  let service: CaptchaService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule, HttpModule],
      providers: [CaptchaService],
    }).compile();

    service = module.get<CaptchaService>(CaptchaService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should verify the token', async() => {
    const httpServiceSpy = spyOn(httpService, 'get').and.returnValue({toPromise: () => ({data: 'test'})})

    expect(await service.verifyCaptcha({token: 'token-test'})).toEqual('test')

    expect(httpServiceSpy).toHaveBeenCalledWith(expect.any(String), {params: expect.objectContaining({
      response: 'token-test',
    })})
  });
});
