import { Body, Controller, ForbiddenException, Post, Req, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { SessionService } from 'apps/onboarding/src/session/session.service'
import { RelayerResponse } from 'apps/relayer/src/app.controller'
import { SubmitMetaTransactionDto } from 'apps/relayer/src/dto/SubmitMetaTransactionDto'

import { AppService } from './app.service'
import { AuthService } from './auth/auth.service'
import { GatewayService } from './gateway/gateway.service'
import { RelayerProxyService } from './relayer_proxy.service'

import { DistributedBlindedPepperDto } from './dto/DistributedBlindedPepperDto'
import { StartSessionDto } from './dto/StartSessionDto'

interface GetPhoneNumberIdResponse {
  identifier: string
}

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
    const resp = await this.relayerProxyService.getPhoneNumberIdentifier(
      distributedBlindedPepperDto
    )

    return {
      identifier: resp.payload
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('requestSubsidisedAttestation')
  async requestSubsidisedAttestation() {
    // const resp = this.relayerProxyService.submitTransactionBatch()
    return {
      txHash: ''
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('submitMetaTransaction')
  async submitMetaTransaction(@Body() body: SubmitMetaTransactionDto) {
    const resp = await this.relayerProxyService.submitTransaction({
      transaction: {
        ...body,
        // MetaTransactions are always without value
        value: "0",
      }
    })

    return {
      txHash: resp.payload
    }
  }
}
