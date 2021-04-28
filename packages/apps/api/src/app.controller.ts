import { normalizeAddress, throwIfError, trimLeading0x } from '@celo/base'
import { ContractKit } from '@celo/contractkit'
import { RawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { EventType, KomenciLoggerService } from '@komenci/logger'
import { Throttle, ThrottlerGuard } from '@komenci/throttler'
import { RelayerResponse } from '@komenci/relayer/dist/app.controller'
import { WalletService } from './wallet/wallet.service'
import { NetworkConfig, networkConfig } from '@komenci/core'
import { ActionCounts, TrackedAction } from './config/quota.config'
import { DeployWalletDto } from './dto/DeployWalletDto'
import { RequestAttestationsDto } from './dto/RequestAttestationsDto'

import { SubmitMetaTransactionDto } from './dto/SubmitMetaTransactionDto'
import { QuotaAction } from './session/quota.decorator'
import { QuotaGuard } from './session/quota.guard'
import { Session as SessionEntity } from './session/session.entity'
import { SubsidyService } from './subsidy/subsidy.service'
import { WalletErrorType } from './wallet/errors'
import { TransactionWithMetadata } from './wallet/method-filter'
import { TxParserService } from './wallet/tx-parser.service'
import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  Scope,
  Session,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { RelayerProxyService } from './relayer/relayer_proxy.service'
import { SessionService } from './session/session.service'

import { AuthService } from './auth/auth.service'
import { appConfig, AppConfig } from './config/app.config'
import { DistributedBlindedPepperDto } from './dto/DistributedBlindedPepperDto'
import { StartSessionDto } from './dto/StartSessionDto'
import { GatewayService } from './gateway/gateway.service'

interface GetPhoneNumberIdResponse {
  combinedSignature: string
}

interface DeployWalletInProgress {
  status: 'in-progress'
  txHash: string
  deployerAddress: string
}

interface DeployWalletDeployed {
  status: 'deployed'
  walletAddress: string
}

type DeployWalletResp = DeployWalletInProgress | DeployWalletDeployed

interface CheckSessionResponse {
  quotaLeft: ActionCounts
  metaTxWalletAddress?: string
}

interface StartSessionResponse {
  token: string
  callbackUrl: string
}

@Controller({
  path: "v1",
  // RelayerProxyService & WalletService are Request scoped
  scope: Scope.REQUEST
})
export class AppController {
  constructor(
    private readonly relayerProxyService: RelayerProxyService,
    private readonly gatewayService: GatewayService,
    private readonly authService: AuthService,
    private readonly subsidyService: SubsidyService,
    private readonly sessionService: SessionService,
    private readonly walletService: WalletService,
    private readonly contractKit: ContractKit,
    @Inject(networkConfig.KEY)
    private readonly networkCfg: NetworkConfig,
    @Inject(appConfig.KEY)
    private readonly appCfg: AppConfig,
    private readonly logger: KomenciLoggerService,
    private readonly txParserService: TxParserService
) {}

  @Get('health')
  health(@Req() req): { status: string } {
    // XXX: This does not indicate whether the service is under
    // load, it is used by k8s to know whether the server
    // is running.
    return {
      status: 'OK'
    }
  }

  @Throttle({
    key: 'start-session',
    checkOnly: true
  })
  @UseGuards(ThrottlerGuard)
  @Get('ready')
  ready(): { status: string } {
    // XXX: This endpoint tells Valora whether to attempt
    // verification or not, this is throttled based on
    // the current config see throttle.config.ts
    return {
      status: 'Ready'
    }
  }

  @Throttle({
    key: 'start-session',
  })
  @UseGuards(ThrottlerGuard)
  @Post('startSession')
  async startSession(
    @Body() startSessionDto: StartSessionDto,
    @Req() req
  ): Promise<StartSessionResponse> {
    if ((await this.gatewayService.verify(startSessionDto, req)) === true) {
      const response = await this.authService.startSession(
        startSessionDto.externalAccount
      )

      this.logger.event(EventType.SessionStart, {
        externalAccount: trimLeading0x(startSessionDto.externalAccount),
        sessionId: response.sessionId
      })

      return { token: response.token, callbackUrl: this.appCfg.callbackUrl }
    } else {
      throw new UnauthorizedException()
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('checkSession')
  async checkSession(
    @Session() session: SessionEntity
  ): Promise<CheckSessionResponse> {
    const getResp = await this.walletService.getWallet(session)
    let walletAddress: string | undefined
    if (getResp.ok) {
      walletAddress = getResp.result
    }

    return {
      quotaLeft: this.sessionService.quotaLeft(session),
      metaTxWalletAddress: walletAddress
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('deployWallet')
  async deployWallet(
    @Body() deployWalletDto: DeployWalletDto,
    @Session() session: SessionEntity
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
      throw getResp.error
    }

    const txHash = throwIfError(await this.walletService.deployWallet(
      session,
      deployWalletDto.implementationAddress
    ))

    return {
      status: 'in-progress',
      txHash: txHash,
      deployerAddress: this.networkCfg.contracts.MetaTransactionWalletDeployer
    }
  }

  @QuotaAction(TrackedAction.DistributedBlindedPepper)
  @UseGuards(
    AuthGuard('jwt'),
    QuotaGuard,
  )
  @Post('distributedBlindedPepper')
  async distributedBlindedPepper(
    @Body() distributedBlindedPepperDto: DistributedBlindedPepperDto,
    @Session() session: SessionEntity,
  ): Promise<GetPhoneNumberIdResponse> {
    const resp = throwIfError(await this.relayerProxyService.getPhoneNumberIdentifier(
      distributedBlindedPepperDto
    ))
    this.logger.event(EventType.PepperRequested, {
      sessionId: session.id,
      externalAccount: session.externalAccount,
      blindedPhoneNumber: distributedBlindedPepperDto.blindedPhoneNumber,
      clientVersion: distributedBlindedPepperDto.clientVersion,
      relayerAddress: resp.relayerAddress
    })

    await this.sessionService.incrementUsage(
      session,
      TrackedAction.DistributedBlindedPepper
    )

    return {
      combinedSignature: resp.payload
    }
  }

  @QuotaAction(TrackedAction.RequestSubsidisedAttestation)
  @UseGuards(
    AuthGuard('jwt'),
    QuotaGuard,
  )
  @Post('requestSubsidisedAttestations')
  async requestSubsidisedAttestations(
    @Body() requestAttestationsDto: RequestAttestationsDto,
    @Session() session: SessionEntity
  ) {
    throwIfError(await this.subsidyService.isValid(
      requestAttestationsDto,
      session
    ))

    const transactions = await this.subsidyService.buildTransactionBatch(
      requestAttestationsDto
    )

    const txSubmit = throwIfError(await this.relayerProxyService.submitTransactionBatch({
      transactions
    }))

    this.logger.event(EventType.AttestationsRequested, {
      sessionId: session.id,
      externalAccount: session.externalAccount,
      txHash: txSubmit.payload,
      relayerAddress: txSubmit.relayerAddress,
      attestationsRequested: requestAttestationsDto.attestationsRequested,
      identifier: requestAttestationsDto.identifier
    })

    await this.sessionService.incrementUsage(
      session,
      TrackedAction.RequestSubsidisedAttestation,
      requestAttestationsDto.attestationsRequested
    )

    return {
      txHash: txSubmit.payload
    }
  }

  @QuotaAction(TrackedAction.SubmitMetaTransaction)
  @UseGuards(
    AuthGuard('jwt'),
    QuotaGuard,
  )
  @Post('submitMetaTransaction')
  async submitMetaTransaction(
    @Body() body: SubmitMetaTransactionDto,
    @Session() session: SessionEntity
  ) {
    throwIfError(await this.walletService.isValidWallet(
      body.destination,
      session.externalAccount
    ))

    const metaTx: RawTransaction = { ...body, value: '0x0' }
    const childTxs = throwIfError(await this.txParserService.parse(metaTx, body.destination))
    const resp = throwIfError(await this.relayerProxyService.submitTransaction({
      transaction: metaTx
    }))

    this.logMetaTransaction(resp, metaTx, childTxs, session)
    await this.sessionService.incrementUsage(
      session,
      TrackedAction.SubmitMetaTransaction
    )

    return {
      txHash: resp.payload
    }
  }

  private logMetaTransaction(
    relayerResp: RelayerResponse<string>,
    metaTx: RawTransaction,
    childTxs: TransactionWithMetadata[],
    session: SessionEntity
  ) {
    this.logger.event(EventType.MetaTransactionSubmitted, {
      sessionId: session.id,
      relayerAddress: relayerResp.relayerAddress,
      externalAccount: session.externalAccount,
      txHash: relayerResp.payload,
      destination: normalizeAddress(metaTx.destination),
      childTxsCount: childTxs.length
    })

    childTxs.map(childTx => ({
      value: childTx.raw.value,
      destination: childTx.raw.destination,
      methodId: childTx.methodId,
      methodName: childTx.methodName,
      contractName: childTx.contractName
    })).forEach((childTx) => this.logger.event(
      EventType.ChildMetaTransactionSubmitted, {
        sessionId: session.id,
        relayerAddress: relayerResp.relayerAddress,
        externalAccount: session.externalAccount,
        txHash: relayerResp.payload,
        ...childTx
      })
    )
  }
}
