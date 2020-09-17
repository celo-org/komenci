import { Injectable } from '@nestjs/common';
import { DeviceCheckService } from '../device-check/device-check.service';
import { Failed, Passed, Rule } from '../rules/rule';
import { SafetyNetService } from '../safety-net/safety-net.service';
import { FastifyRequest } from 'fastify';

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

  isAndroidRequest(req: FastifyRequest): boolean {
    return false
  }

  isIOSRequest(req: FastifyRequest): boolean {
    return false
  }
  async verify(req, config, context) {
    if (this.isAndroidRequest(req)) {
      const input = {
        signedAttestation: req.body['signedAttestation'],
      }
      const result = (await this.safetyNetService.verifyDevice(input))
      // TODO: Add propper error handling in safetyNet
      if (result.isValidSignature) {
        return Passed()
      }
    } else if (this.isIOSRequest(req)) {
      const input = {}
      const result = await this.deviceCheckService.verifyDevice(input)
      // TODO: Add propper error handling in deviceCheck
      if (result) {
        return Passed()
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