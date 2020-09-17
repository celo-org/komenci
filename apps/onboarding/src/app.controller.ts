import { Body, Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { GatewayService } from './gateway/gateway.service';

import { GetPhoneNumberIdResponse } from '../../relayer/src/relayer.service';
import { DistributedBlindedPepperDto } from './dto/DistributedBlindedPepperDto';
import { StartSessionDto } from './dto/StartSessionDto';
import { RelayerProxyService } from './relayer_proxy.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly relayerProxyService: RelayerProxyService,
    private readonly gatewayService: GatewayService,
  ) {}

  @Post('startSession')
  async startSession(
    @Body() startSessionDto: StartSessionDto,
    @Req() req,
  ): Promise<any> {
    if ((await this.gatewayService.verify(startSessionDto, req)) === true) {
      return { id: 'new-session' };
    } else {
      return { error: 'gateway-not-passed' };
    }
  }

  @Post('deployWallet')
  deployWallet(): any {
    return { id: 'new-session' };
  }

  @Post('distributedBlindedPepper')
  async distributedBlindedPepper(
    @Body() distributedBlindedPepperDto: DistributedBlindedPepperDto,
  ): Promise<GetPhoneNumberIdResponse> {
    return this.relayerProxyService.getPhoneNumberIdentifier(
      distributedBlindedPepperDto,
    );
  }

  @Post('startAttestations')
  async startAttestation() {
    return this.relayerProxyService.submitTransaction({ tx: {} });
  }

  @Post('completeAttestation')
  async completeAttestation() {
    return this.relayerProxyService.submitTransaction({ tx: {} });
  }
}
