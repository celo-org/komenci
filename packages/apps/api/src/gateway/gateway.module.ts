import { KomenciLoggerService } from '@komenci/logger'
import { HttpModule, Module } from '@nestjs/common'
import { CaptchaService } from './captcha/captcha.service'
import { DeviceCheckService } from './device-check/device-check.service'
import { GatewayService } from './gateway.service'
import { SafetyNetService } from './safety-net/safety-net.service'

@Module({
  imports: [HttpModule],
  providers: [
    GatewayService,
    CaptchaService,
    DeviceCheckService,
    SafetyNetService,
    KomenciLoggerService
  ],
  exports: [GatewayService]
})
export class GatewayModule {}
