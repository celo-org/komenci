import { Controller, Get, Inject, Post } from '@nestjs/common';
import { RelayerProxyService } from './relayer_proxy.service';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly relayerProxyService: RelayerProxyService,
  ) {}

  @Post("startSession")
  startSession(): any {
    return {id: 'new-session'}
  }

  @Get("distributedBlindedPepper")
  async distributedBlindedPepper() {
    return this.relayerProxyService.signPersonalMessage({
      data: Buffer.alloc(0)
    })
  }

  @Get("startAttestation")
  async startAttestation() {
    return this.relayerProxyService.submitTransaction({tx: {}})
  }
}
