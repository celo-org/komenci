import { AppConfig, appConfig } from '@app/onboarding/config/app.config'
import { RequestAttestationsDto } from '@app/onboarding/dto/RequestAttestationsDto'
import { RelayerProxyService } from '@app/onboarding/relayer_proxy.service'
import { Session } from '@app/onboarding/session/session.entity'
import { SessionService } from '@app/onboarding/session/session.service'
import { ContractKit } from '@celo/contractkit'
import { RawTransaction, toRawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { MetaTransactionWalletDeployerWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWalletDeployer'
import { Inject, Injectable } from '@nestjs/common'
import { RawTransactionDto } from 'apps/relayer/src/dto/RawTransactionDto'

@Injectable()
export class SubsidyService {
  constructor(
    private readonly relayerProxyService: RelayerProxyService,
    private readonly sessionService: SessionService,
    private readonly contractKit: ContractKit,
    private readonly walletDeployer: MetaTransactionWalletDeployerWrapper,
    @Inject(appConfig.KEY)
    private readonly cfg: AppConfig
  ) {}

  public async buildTransactionBatch(
    input: RequestAttestationsDto,
    session: Session
  ): Promise<RawTransaction[]> {
    const beforeRequestsCount = await this.getCurrentRequestedAttestations(
      input.identifier,
      session.externalAccount
    )
    const afterRequestsCount = beforeRequestsCount + input.attestationsRequested
    const walletAddress = await this.walletDeployer.getWallet(session.externalAccount)

    return [
      await this.buildGuard(input.identifier, walletAddress, beforeRequestsCount),
      // await this.buildSubsidyTransfer(input.attestationsRequested, walletAddress),
      // input.transactions.approve,
      // input.transactions.request,
      // await this.buildGuard(input.identifier, walletAddress, afterRequestsCount)
    ]

  }

  private async getCurrentRequestedAttestations(identifier: string, account: string): Promise<number> {
    const attestations = await this.contractKit.contracts.getAttestations()
    const stats = await attestations.getAttestationStat(identifier, account)
    return stats.total
  }

  private async buildGuard(identifier: string, account: string, count: number): Promise<RawTransactionDto> {
    const attestations = await this.contractKit.contracts.getAttestations()
    return toRawTransaction(
      attestations.requireNAttestationsRequested(identifier, account, count).txo
    )
  }

  private async buildSubsidyTransfer(attestationsRequested: number, account: string): Promise<RawTransactionDto> {
    const attestations = await this.contractKit.contracts.getAttestations()
    const stableToken = await this.contractKit.contracts.getStableToken()
    const fee = await attestations.getAttestationFeeRequired(attestationsRequested)
    return toRawTransaction(
      stableToken.transferFrom(this.cfg.fundAddress, account, fee.toFixed()).txo
    )
  }
}
