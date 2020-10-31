import { AppConfig, appConfig } from '@app/onboarding/config/app.config'
import { DeployWalletDto } from '@app/onboarding/dto/DeployWalletDto'
import { RequestAttestationsDto } from '@app/onboarding/dto/RequestAttestationsDto'
import { Session as SessionEntity } from '@app/onboarding/session/session.entity'
import { SubsidyService } from '@app/onboarding/subsidy/subsidy.service'
import { WalletErrorType } from '@app/onboarding/wallet/errors'
import { TxFilter, WalletService } from '@app/onboarding/wallet/wallet.service'
import { ContractKit } from '@celo/contractkit'
import { RawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import {
  Body,
  Controller,
  ForbiddenException, Get,
  Inject,
  Post,
  Req,
  Session, UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
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
  // Cache for the allowed metaTx filter
  _allowedMetaTransaction?: TxFilter[]

  constructor(
    private readonly relayerProxyService: RelayerProxyService,
    private readonly gatewayService: GatewayService,
    private readonly authService: AuthService,
    private readonly subsidyService: SubsidyService,
    private readonly sessionService: SessionService,
    private readonly walletService: WalletService,
    private readonly contractKit: ContractKit,
    @Inject(appConfig.KEY)
    private readonly cfg: AppConfig
  ) {}

  @Get('health')
  health(
    @Req() req
  ): {status: string} {
    // TODO: Think about how to have a more clear understanding of
    // service health here. Think about the relayer load balancer health
    // or maybe just a toggle that we can do from ENV vars?
    return {
      status: 'OK'
    }
  }

  @Post('startSession')
  async startSession(
    @Body() startSessionDto: StartSessionDto,
    @Req() req
  ): Promise<{token: string}> {
    if ((await this.gatewayService.verify(startSessionDto, req)) === true) {
      const token = await this.authService.startSession(startSessionDto.externalAccount)
      return {token}
    } else {
      throw new UnauthorizedException()
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

    if (getResp.ok === true) {
      return {
        status: 'deployed',
        walletAddress: getResp.result
      }
    }

    if (getResp.error.errorType !== WalletErrorType.NotDeployed) {
      throw(getResp.error)
    }

    const deployResp = await this.walletService.deployWallet(
      session,
      deployWalletDto.implementationAddress
    )

    if (deployResp.ok === true) {
      return {
        status: 'in-progress',
        txHash: deployResp.result,
        deployerAddress: this.cfg.mtwDeployerAddress
      }
    } else {
      throw(deployResp.error)
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
  async submitMetaTransaction(
    @Body() body: SubmitMetaTransactionDto,
    @Session() session: SessionEntity
  ) {
    const metaTx: RawTransaction = {
      ...body,
      value: "0x0"
    }

    const validTx = await this.walletService.isAllowedMetaTransaction(
      metaTx,
      await this.allowedMetaTransactions()
    )

    if (validTx.ok === false) {
      throw(validTx.error)
    }

    const resp = await this.relayerProxyService.submitTransaction({
      transaction: metaTx
    })

    return {
      txHash: resp.payload
    }
  }

  private async allowedMetaTransactions(): Promise<TxFilter[]> {
    if (this._allowedMetaTransaction === undefined) {
      const attestations = await this.contractKit.contracts.getAttestations()
      const accounts = await this.contractKit.contracts.getAccounts()
      const cUSD = await this.contractKit.contracts.getStableToken()

      this._allowedMetaTransaction = [
        {
          destination: attestations.address,
          methodId: attestations.methodIds.selectIssuers
        },
        {
          destination: attestations.address,
          methodId: attestations.methodIds.complete
        },
        {
          destination: accounts.address,
          methodId: accounts.methodIds.setAccount
        },
        {
          destination: cUSD.address,
          methodId: cUSD.methodIds.approve
        }
      ]
    }
    return this._allowedMetaTransaction
  }
}
