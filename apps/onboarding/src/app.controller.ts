import { AppConfig, appConfig } from '@app/onboarding/config/app.config'
import { RequestAttestationsDto } from '@app/onboarding/dto/RequestAttestationsDto'
import { SessionDecorator } from '@app/onboarding/session/session.decorator'
import { Session as SessionEntity } from '@app/onboarding/session/session.entity'
import { SubsidyService } from '@app/onboarding/subsidy/subsidy.service'
import { WalletErrorType, WalletService } from '@app/onboarding/wallet/wallet.service'
import { newMetaTransactionWallet } from '@celo/contractkit/lib/generated/MetaTransactionWallet'
import { toRawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { Body, Controller, ForbiddenException, Inject, Post, Req, Session, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { SessionService } from 'apps/onboarding/src/session/session.service'
import { SubmitMetaTransactionDto } from 'apps/relayer/src/dto/SubmitMetaTransactionDto'
import { Logger } from 'nestjs-pino'

import { AuthService } from './auth/auth.service'

import { DistributedBlindedPepperDto } from './dto/DistributedBlindedPepperDto'
import { StartSessionDto } from './dto/StartSessionDto'
import { GatewayService } from './gateway/gateway.service'
import { RelayerProxyService } from './relayer_proxy.service'

interface GetPhoneNumberIdResponse {
  identifier: string
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

@Controller()
export class AppController {
  constructor(
    private readonly logger: Logger,
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
    @Session() session: SessionEntity,
  ): Promise<DeployWalletResp> {
    const getResp = await this.walletService.getWallet(session)
    if (getResp.ok) {
      return {
        status: 'deployed',
        walletAddress: getResp.result
      }
    } else if (getResp.ok === false) {
      if (getResp.error.errorType === WalletErrorType.NotDeployed) {
        const deployResp = await this.walletService.deployWallet(session)
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
      identifier: resp.payload
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('requestSubsidisedAttestation')
  async requestSubsidisedAttestation(
    @Body() requestAttestationsDto: RequestAttestationsDto,
    @Session() session: SessionEntity,
) {
    const resp = await this.relayerProxyService.submitTransactionBatch({
      transactions: await this.subsidyService.buildTransactionBatch(requestAttestationsDto)
    })

    return {
      txHash: resp.payload
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
