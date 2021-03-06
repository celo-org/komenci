import { Err, Ok, RootError } from '@celo/base/lib/result'
import { Injectable } from '@nestjs/common'
import {
  DeviceType,
  StartSessionDto
} from '../..//dto/StartSessionDto'
import { DeviceCheckService } from '../device-check/device-check.service'
import { GatewayContext, Rule, RuleID } from '../rules/rule'
import { SafetyNetService } from '../safety-net/safety-net.service'

enum DeviceAttestationErrorTypes {
  InvalidDevice = 'invalid-device',
  VerificationFailed = 'verification-failed'
}

export class InvalidDeviceError extends RootError<DeviceAttestationErrorTypes> {
  constructor() {
    super(DeviceAttestationErrorTypes.InvalidDevice)
  }
}

export class VerificationFailedError extends RootError<
  DeviceAttestationErrorTypes
> {
  constructor() {
    super(DeviceAttestationErrorTypes.VerificationFailed)
  }
}

type DeviceAttestationErrors = InvalidDeviceError | VerificationFailedError

@Injectable()
export class DeviceAttestationRule
  implements Rule<unknown, DeviceAttestationErrors> {
  constructor(
    private deviceCheckService: DeviceCheckService,
    private safetyNetService: SafetyNetService
  ) {}

  getID() {
    return RuleID.DeviceAttestation
  }

  async verify(
    input: StartSessionDto,
    config: unknown,
    context: GatewayContext
  ) {
    if (input.deviceType === DeviceType.Android) {
      const result = await this.safetyNetService.verifyDevice({
        signedAttestation: input.androidSignedAttestation
      })
      // TODO: Add propper error handling in safetyNet
      if (result.isValidSignature) {
        return Ok(true)
      } else {
        // This should wrap the error returned from safetynet
        return Err(new VerificationFailedError())
      }
    } else if (input.deviceType === DeviceType.iOS) {
      const result = await this.deviceCheckService.verifyDevice({deviceToken: input.iosDeviceToken})
      // TODO: Add propper error handling in deviceCheck
      if (result) {
        return Ok(true)
      } else {
        // This should wrap the error returned from safetynet
        return Err(new VerificationFailedError())
      }
    }
    return Err(new InvalidDeviceError())
  }
}
