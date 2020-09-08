import { HttpService, Inject, Injectable } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import thirdPartyConfig from '../../config/third-party.config'
import { ReCAPTCHAResponseDto } from '../../dto/ReCAPTCHAResponseDto'

@Injectable()
export class CaptchaService {
  constructor(
    @Inject(thirdPartyConfig.KEY)
    private config: ConfigType<typeof thirdPartyConfig>,
    private httpService: HttpService
  ) {}

  async verifyCaptcha(input: {token: string}): Promise<ReCAPTCHAResponseDto> {
    const reCAPTCHAResponse = await this.httpService.get<ReCAPTCHAResponseDto>(this.config.recaptchaUri, {
      params: {
        secret: this.config.recaptchaToken,
        response: input.token
      }
    }).toPromise()
    return reCAPTCHAResponse.data
  }
}