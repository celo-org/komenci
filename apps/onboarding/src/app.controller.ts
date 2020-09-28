import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common'
import { AppService } from './app.service'
import { GatewayService } from './gateway/gateway.service'

import { GetPhoneNumberIdResponse } from '../../relayer/src/relayer.service'
import { DistributedBlindedPepperDto } from './dto/DistributedBlindedPepperDto'
import { StartSessionDto } from './dto/StartSessionDto'
import { RelayerProxyService } from './relayer_proxy.service'
import { AuthService } from './session/auth/auth.service'
import { AuthenticatedGuard } from './session/guards/authenticated.guard'
// import { SessionDecorator } from './session/session.decorator'
import { Session } from './session/session.entity'

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly relayerProxyService: RelayerProxyService,
    private readonly gatewayService: GatewayService,
    private readonly authService: AuthService
  ) {}

  @Post('startSession')
  async startSession(
    @Body() startSessionDto: StartSessionDto,
    @Req() req
  ): Promise<any> {
    // if ((await this.gatewayService.verify(startSessionDto, req)) === true) {
    if (true) {
      return this.authService.access(startSessionDto.externalAccount)
    } else {
      return { error: 'gateway-not-passed' }
    }
  }

  @UseGuards(AuthenticatedGuard)
  @Post('deployWallet')
  deployWallet  (
    // @SessionDecorator() session: Session
    ): any {
    return { id: 'new-session' }
  }

  @UseGuards(AuthenticatedGuard)
  @Post('distributedBlindedPepper')
  async distributedBlindedPepper(
    @Body() distributedBlindedPepperDto: DistributedBlindedPepperDto
  ): Promise<GetPhoneNumberIdResponse> {
    return this.relayerProxyService.getPhoneNumberIdentifier(
      distributedBlindedPepperDto
    )
  }

  @UseGuards(AuthenticatedGuard)
  @Post('startAttestations')
  async startAttestation() {
    return this.relayerProxyService.submitTransaction({ tx: {} })
  }

  @UseGuards(AuthenticatedGuard)
  @Post('completeAttestation')
  async completeAttestation() {
    return this.relayerProxyService.submitTransaction({ tx: {} })
  }
}
