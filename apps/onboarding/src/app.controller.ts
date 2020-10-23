import { AppConfig, appConfig } from '@app/onboarding/config/app.config'
import { DeployWalletDto } from '@app/onboarding/dto/DeployWalletDto'
import { RequestAttestationsDto } from '@app/onboarding/dto/RequestAttestationsDto'
import { Session as SessionEntity } from '@app/onboarding/session/session.entity'
import { SubsidyService } from '@app/onboarding/subsidy/subsidy.service'
import { WalletErrorType, WalletService } from '@app/onboarding/wallet/wallet.service'
import { Body, Controller, ForbiddenException, Inject, Post, Req, Session, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { SessionService } from 'apps/onboarding/src/session/session.service'
import { SubmitMetaTransactionDto } from 'apps/relayer/src/dto/SubmitMetaTransactionDto'

import { AuthService } from './auth/auth.service'

import { DistributedBlindedPepperDto } from './dto/DistributedBlindedPepperDto'
import { StartSessionDto } from './dto/StartSessionDto'
import { GatewayService } from './gateway/gateway.service'
import { RelayerProxyService } from './relayer_proxy.service'

interface GetPhoneNumberIdResponse {
  identifier: string
  pepper: string
}

interface DeployWalletInProgress {
  status: 'in-progress',
  txHash: string,
  deployerAddress: string,
}

interface DeployWalletDeployed {
  status: 'deployed',
  walletAddress: string
}

type DeployWalletResp = DeployWalletInProgress | DeployWalletDeployed

@Controller("v1")
export class AppController {
  constructor(
    private readonly relayerProxyService: RelayerProxyService,
    private readonly gatewayService: GatewayService,
    private readonly authService: AuthService,
    private readonly subsidyService: SubsidyService,
    private readonly sessionService: SessionService,
    private readonly walletService: WalletService,
    @Inject(appConfig.KEY)
    private readonly cfg: AppConfig
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
  async deployWallet(
    @Body() deployWalletDto: DeployWalletDto,
    @Session() session: SessionEntity,
  ): Promise<DeployWalletResp> {
    const getResp = await this.walletService.getWallet(
      session,
      deployWalletDto.implementationAddress
    )

    if (getResp.ok) {
      return {
        status: 'deployed',
        walletAddress: getResp.result
      }
    } else if (getResp.ok === false) {
      if (getResp.error.errorType === WalletErrorType.NotDeployed) {
        const deployResp = await this.walletService.deployWallet(
          session,
          deployWalletDto.implementationAddress
        )

        if (deployResp.ok) {
          return {
            status: 'in-progress',
            txHash: deployResp.result,
            deployerAddress: this.cfg.mtwDeployerAddress
          }
        } else if (deployResp.ok === false) {
          throw(deployResp.error)
        }
      } else {
        throw(getResp.error)
      }
    }
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
      identifier: resp.payload.phoneHash,
      pepper: resp.payload.pepper
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('requestSubsidisedAttestations')
  async requestSubsidisedAttestations(
    @Body() requestAttestationsDto: RequestAttestationsDto,
    @Session() session: SessionEntity,
  ) {
    const res = await this.subsidyService.isValid(requestAttestationsDto, session)

    if (res.ok === false) {
      throw(res.error)
    }

    const txSubmit = await this.relayerProxyService.submitTransactionBatch({
      transactions: await this.subsidyService.buildTransactionBatch(requestAttestationsDto)
    })

    return {
      txHash: txSubmit.payload
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
