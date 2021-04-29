import { thirdPartyConfig } from '../../config/third-party.config'
import { Ok } from '@celo/base/lib/result'
import { HttpModule, HttpService } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { HttpErrorTypes } from '../../errors/http'
import { AxiosError, AxiosResponse } from 'axios'
import { Observable, of } from 'rxjs'
import { CaptchaService, ReCAPTCHAErrorTypes } from './captcha.service'
import { ErrorCode, ReCAPTCHAResponseDto } from './ReCAPTCHAResponseDto'

const makeResponse = (
  data: ReCAPTCHAResponseDto
): Observable<AxiosResponse<ReCAPTCHAResponseDto>> =>
  of({
    data: data,
    status: 200,
    statusText: 'Ok',
    config: {},
    headers: {}
  })

const okResponse = makeResponse({
  success: true,
  hostname: null,
  challenge_ts: '2020-09-16T12:34:35Z',
  apk_package_name: null,
  action: '',
  'error-codes': []
})

const makeReCaptchaError = (...codes: ErrorCode[]) =>
  makeResponse({
    success: false,
    hostname: null,
    challenge_ts: '2020-09-16T12:34:35Z',
    apk_package_name: null,
    action: '',
    'error-codes': codes
  })

const httpError: Observable<AxiosError> = of({
  isAxiosError: true,
  config: {},
  name: '',
  message: '',
  toJSON: () => ({})
})

describe('CaptchaService', () => {
  let service: CaptchaService
  const httpService = {
    'get': jest.fn()
  }

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
      providers: [CaptchaService]
    }).overrideProvider(HttpService).useValue(httpService).compile()

    service = module.get<CaptchaService>(CaptchaService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should verify the token', async () => {
    const httpServiceSpy = spyOn(httpService, 'get').and.returnValue(okResponse)
    expect(await service.verifyCaptcha('token-test')).toEqual(Ok(true))
    expect(httpServiceSpy).toHaveBeenCalledWith(expect.any(String), {
      params: expect.objectContaining({
        response: 'token-test'
      })
    })
  })

  it('should fail with a http request error when an http error occurs', async () => {
    spyOn(httpService, 'get').and.returnValue(httpError)
    const result = await service.verifyCaptcha('token-test')
    expect(result.ok).toEqual(false)
    if (result.ok === false) {
      // type inference for result
      expect(result.error.errorType).toEqual(HttpErrorTypes.RequestError)
    }
  })

  it('should fail with a recaptcha error when error codes are returned', async () => {
    const errorCodes = [ErrorCode.BadRequest, ErrorCode.TimeoutOrDuplicate]
    spyOn(httpService, 'get').and.returnValue(
      makeReCaptchaError(...errorCodes)
    )
    const result = await service.verifyCaptcha('token-test')
    expect(result.ok).toEqual(false)
    if (result.ok === false) {
      // type inference for result
      expect(result.error.errorType).toEqual(
        ReCAPTCHAErrorTypes.VerificationFailed
      )
      if (result.error.errorType === ReCAPTCHAErrorTypes.VerificationFailed) {
        expect(result.error.errorCodes).toEqual(errorCodes)
      }
    }
  })
})
