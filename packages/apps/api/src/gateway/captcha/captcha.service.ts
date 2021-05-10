import { Err, Ok, Result } from '@celo/base/lib/result'
import { MetadataError } from '@komenci/core'
import {
  HttpService,
  Inject,
  Injectable,
} from '@nestjs/common'
import { thirdPartyConfig, ThirdPartyConfig } from '../../config/third-party.config'
import { HttpRequestError } from '../../errors/http'
import { ErrorCode, ReCAPTCHAResponseDto } from './ReCAPTCHAResponseDto'

export enum ReCAPTCHAErrorTypes {
  VerificationFailed = 'RecaptchaVerificationFailed'
}

export class CaptchaVerificationFailed extends MetadataError<ReCAPTCHAErrorTypes> {
  metadataProps = ['errorCodes', 'token']
  constructor(readonly errorCodes: ErrorCode[], readonly token: string) {
    super(ReCAPTCHAErrorTypes.VerificationFailed)
  }
}

export type CaptchaServiceErrors = CaptchaVerificationFailed | HttpRequestError

@Injectable()
export class CaptchaService {
  constructor(
    @Inject(thirdPartyConfig.KEY)
    private config: ThirdPartyConfig,
    private httpService: HttpService
  ) {}

  async verifyCaptcha(
    token: string
  ): Promise<Result<boolean, CaptchaServiceErrors>> {
    return this.httpService
      .get<ReCAPTCHAResponseDto>(this.config.recaptchaUri, {
        params: {
          secret: this.config.recaptchaToken,
          response: token
        }
      })
      .toPromise()
      .then(({ data }) => {
        if (data.success === true) {
          return Ok(true)
        } else {
          return Err(new CaptchaVerificationFailed(
            data['error-codes'],
            token
          ))
        }
      })
      .catch(error => {
        return Err(new HttpRequestError(error))
      })
  }
}
