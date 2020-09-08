import { Module, HttpModule } from '@nestjs/common';
import { CaptchaService } from './captcha/captcha.service';
import { DeviceCheckService } from './device-check/device-check.service';
import { SafetyNetService } from './safety-net/safety-net.service';
import { GatewayService } from './gateway.service';

@Module({
  imports: [HttpModule],
  providers: [GatewayService, CaptchaService, DeviceCheckService, SafetyNetService],
  exports: [GatewayService],
})
export class GatewayModule {}
