import { HttpService, Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import thirdPartyConfig from '../../config/third-party.config';
import { DeviceCheckDto } from '../../dto/DeviceCheckDto';
import jwt from "jsonwebtoken";
import fs from "fs";
import uuidv4 from "uuid";


@Injectable()
export class DeviceCheckService {
  constructor(
    @Inject(thirdPartyConfig.KEY)
    private config: ConfigType<typeof thirdPartyConfig>,
    private httpService: HttpService
  ) {}

  async verifyDevice(input: {deviceToken: string}): Promise<DeviceCheckDto> {
    console.log(input.deviceToken)
    /* A 10-character Team ID, obtained from your developer account (https://developer.apple.com/account/) */
    const teamID = this.config.appleDeviceCheckTeamID
    /* A 10-character key identifier, obtained from your developer account (https://developer.apple.com/account/) */
    const keyIdentifier = this.config.appleDeviceCheckKeyID
    /* A file name of p8 format private key download from Certificates, Identifiers & Profiles (https://developer.apple.com/account/ios/certificate) */
    const keyFileName = this.config.appleDeviceCheckKeyFilename
    const cert = fs.readFileSync(keyFileName).toString()
    const JWT = jwt.sign({}, cert, { algorithm: "ES256", keyid: keyIdentifier, issuer: teamID })

    const verifyUrl = `${this.config.appleDeviceCheckUrl}/v1/validate_device_token`
    const deviceCheckResponse = await this.httpService.post<DeviceCheckDto>(verifyUrl, {
      compress: false,
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${JWT}`,
        'Content-Type':'application/json'
      },
      data: { 
        "device_token" : input.deviceToken ,
        "transaction_id" : uuidv4(),
        "timestamp" : Date.now() 
     },
    }).toPromise()
    if(deviceCheckResponse.status != 200){
      console.log('The Ios attestation request failed.')
    }
    return deviceCheckResponse.data
  }
}
