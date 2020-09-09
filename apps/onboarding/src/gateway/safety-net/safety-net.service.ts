import { HttpService, Inject, Injectable } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import thirdPartyConfig from '../../config/third-party.config'
import { ReCAPTCHAResponseDto } from '../../dto/ReCAPTCHAResponseDto'
import { SafetyNetDto } from '../../dto/SafetyNetDto'

@Injectable()
export class SafetyNetService {
  constructor(
    @Inject(thirdPartyConfig.KEY)
    private config: ConfigType<typeof thirdPartyConfig>,
    private httpService: HttpService
) {}

  // TODO determine what the propper input is for this
  async verifyDevice(input: { signedAttestation:string }): Promise<SafetyNetDto> {
    const verifyUrl = `https://www.googleapis.com/androidcheck/v1/attestations/verify?key=${this.config.androidSafetyNetToken}`
    const safetyNetResponse = await this.httpService.post<SafetyNetDto>(verifyUrl, {
      body: JSON.stringify({ data: input.signedAttestation || '' }),
      compress: false,
      method: 'POST',
    }).toPromise()
    if(safetyNetResponse.status != 200){
      console.log('The Android attestation request failed.')
    }
    // const {isValidSignature} = await response.json()
    return safetyNetResponse.data
  }
}
