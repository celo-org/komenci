import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { SessionService } from 'apps/onboarding/src/session/session.service'
import { ForbiddenException } from '@nestjs/common'

import { AppService } from './app.service'
import { AuthService } from './auth/auth.service'
import { GatewayService } from './gateway/gateway.service'
import { RelayerProxyService } from './relayer_proxy.service'

import { GetPhoneNumberIdResponse } from '../../relayer/src/relayer.service'
import { DistributedBlindedPepperDto } from './dto/DistributedBlindedPepperDto'
import { StartSessionDto } from './dto/StartSessionDto'

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly relayerProxyService: RelayerProxyService,
    private readonly gatewayService: GatewayService,
    private readonly authService: AuthService,
    private readonly sessionService: SessionService
  ) {}

  @Post('startSession')
  async startSession(
    @Body() startSessionDto: StartSessionDto,
    @Req() req
  ): Promise<{token: string}> {
    if ((await this.gatewayService.verify(startSessionDto, req)) === true) {
      const token = await this.authService.startSession(startSessionDto.externalAccount)
      return {token}
    } else {
      throw new ForbiddenException()
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('deployWallet')
  deployWallet  (@Body() body: StartSessionDto): any {
    return { id: 'new-session' }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('distributedBlindedPepper')
  async distributedBlindedPepper(
    @Body() distributedBlindedPepperDto: DistributedBlindedPepperDto
  ): Promise<GetPhoneNumberIdResponse> {
    return this.relayerProxyService.getPhoneNumberIdentifier(
      distributedBlindedPepperDto
    )
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('startAttestations')
  async startAttestation() {
    return this.relayerProxyService.submitTransaction({ tx: {} })
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('completeAttestation')
  async completeAttestation() {
    return this.relayerProxyService.submitTransaction({ tx: {} })
  }
}
