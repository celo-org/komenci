import { Injectable } from '@nestjs/common';
import { DeviceCheckService } from '../device-check/device-check.service';
import { Rule } from './rule';
import { SafetyNetService } from '../safety-net/safety-net.service';
import { FastifyRequest } from 'fastify';

@Injectable()
export class DeviceAttestationRule implements Rule<unknown, unknown> {
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
      return (await this.safetyNetService.verifyDevice(input)).isValidSignature
    } else if (this.isIOSRequest(req)) {
      const input = {
        deviceToken: req.body['deviceToken']
      }
      return (await this.deviceCheckService.verifyDevice(input)).isValidSignature
    }
    return false
  }

  validateConfig(config: unknown): unknown {
    return config;
  }

  defaultConfig(): unknown {
    return null
  }
}