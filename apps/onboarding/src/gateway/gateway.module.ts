import { Module } from '@nestjs/common';
import { CaptchaService } from 'apps/onboarding/src/gateway/captcha/captcha.service';
import { DeviceCheckService } from 'apps/onboarding/src/gateway/device-check/device-check.service';
import { SafetyNetService } from 'apps/onboarding/src/gateway/safety-net/safety-net.service';
import { GatewayService } from './gateway.service';

@Module({
  providers: [GatewayService, CaptchaService, DeviceCheckService, SafetyNetService],
  exports: [GatewayService],
})
export class GatewayModule {}
