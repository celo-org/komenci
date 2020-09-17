import { Err, Ok, Result, RootError } from '@celo/base/lib/result';
import { HttpService, Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config'
import { HttpRequestError } from '../../errors/http';
import thirdPartyConfig from '../../config/third-party.config'
import { ErrorCode, ReCAPTCHAResponseDto } from './ReCAPTCHAResponseDto';

export enum ReCAPTCHAErrorTypes {
  VerificationFailed = "VerificationFailed"
}

class VerificationFailed extends RootError<ReCAPTCHAErrorTypes> {
  constructor(public errorCodes: ErrorCode[]) {
    super(ReCAPTCHAErrorTypes.VerificationFailed);
  }
}

export type CaptchaServiceErrors = VerificationFailed | HttpRequestError

@Injectable()
export class CaptchaService {
  constructor(
    @Inject(thirdPartyConfig.KEY)
    private config: ConfigType<typeof thirdPartyConfig>,
    private httpService: HttpService
  ) {}

  async verifyCaptcha(input: {token: string}): Promise<Result<boolean, CaptchaServiceErrors>> {
   return this.httpService.get<ReCAPTCHAResponseDto>(this.config.recaptchaUri, {
      params: {
        secret: this.config.recaptchaToken,
        response: input.token
      }
   }).toPromise().then(({data}) => {
     if (data.success == true) {
       return Ok(true)
     } else {
       return Err(new VerificationFailed(data['error-codes']))
     }
   }).catch((error) => {
     return Err(new HttpRequestError(error))
   })
  }
}