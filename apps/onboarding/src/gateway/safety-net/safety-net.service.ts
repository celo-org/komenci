import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import thirdPartyConfig from '../../config/third-party.config';
import fetch from 'node-fetch';

@Injectable()
export class SafetyNetService {
  constructor(
    @Inject(thirdPartyConfig.KEY)
    private config: ConfigType<typeof thirdPartyConfig>
  ) {}

  // TODO determine what the propper input is for this
  async verifyDevice(input: { signedAttestation:string }): Promise<boolean> {
    const verifyUrl = `https://www.googleapis.com/androidcheck/v1/attestations/verify?key=${this.config.androidSafetyNetToken}`
    const response = await fetch(verifyUrl, {
      body: JSON.stringify({ data: input.signedAttestation || '' }),
      compress: false,
      method: 'POST',
    })
    if(response.status != 200){
      console.log('The Android attestation request failed.')
    }
    const {isValidSignature} = await response.json()
    return isValidSignature
  }
}
