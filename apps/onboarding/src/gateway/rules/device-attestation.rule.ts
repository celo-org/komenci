import { Injectable } from '@nestjs/common';
import { DeviceType, StartSessionDto } from 'apps/onboarding/src/dto/StartSessionDto';
import { DeviceCheckService } from '../device-check/device-check.service';
import { Failed, GatewayContext, Passed, Rule } from '../rules/rule';
import { SafetyNetService } from '../safety-net/safety-net.service';

enum DeviceAttestationRuleFailureReasons {
  InvalidDevice = "invalid-device",
  VerificationFailed = "verification-failed"
}

@Injectable()
export class DeviceAttestationRule implements Rule<unknown, DeviceAttestationRuleFailureReasons> {
  constructor(
    private deviceCheckService: DeviceCheckService,
    private safetyNetService: SafetyNetService
  ) {}

  getID(): string {
    return "DeviceAttestationRule"
  }

  async verify(input: StartSessionDto, config: unknown, context: GatewayContext) {
    if (input.deviceType == DeviceType.Android) {
      const result = await this.safetyNetService.verifyDevice({
        signedAttestation: input.androidSignedAttestation
      })
      // TODO: Add propper error handling in safetyNet
      if (result.isValidSignature) {
        return Passed()
      } else {
        return Failed(DeviceAttestationRuleFailureReasons.VerificationFailed)
      }
    } else if (input.deviceType == DeviceType.iOS) {
      const input = {}
      const result = await this.deviceCheckService.verifyDevice(input)
      // TODO: Add propper error handling in deviceCheck
      if (result) {
        return Passed()
      } else {
        return Failed(DeviceAttestationRuleFailureReasons.VerificationFailed)
      }
    }
    return Failed(DeviceAttestationRuleFailureReasons.InvalidDevice)
  }

  validateConfig(config: unknown): unknown {
    return config;
  }

  defaultConfig(): unknown {
    return null
  }
}