import { AppConfig, appConfig } from '@app/onboarding/config/app.config'
import { RequestAttestationsDto } from '@app/onboarding/dto/RequestAttestationsDto'
import { ContractKit } from '@celo/contractkit'
import { RawTransaction, toRawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { Inject, Injectable } from '@nestjs/common'
import { RawTransactionDto } from 'apps/relayer/src/dto/RawTransactionDto'

@Injectable()
export class SubsidyService {
  constructor(
    private readonly contractKit: ContractKit,
    @Inject(appConfig.KEY)
    private readonly cfg: AppConfig
  ) {}

  public async buildTransactionBatch(
    input: RequestAttestationsDto
  ): Promise<RawTransaction[]> {
    const {
      identifier, walletAddress, transactions, attestationsRequested
    } = input

    const batch = [
      await this.buildSubsidyTransfer(attestationsRequested, walletAddress),
      transactions.approve,
      transactions.request,
    ]

    if (!this.cfg.useAttestationGuards) {
      return batch
    } else {
      // TODO: Once we have a new version of Attestations.sol deployed
      // to testnets we can toggle this feature and test the flow
      // When we're comfortable we can remove the feature flag and do
      // only guarded attestations.

      const beforeRequestsCount = await this.getCurrentRequestedAttestations(
        identifier,
        walletAddress,
      )
      const afterRequestsCount = beforeRequestsCount + attestationsRequested

      return [
        await this.buildGuard(identifier, walletAddress, beforeRequestsCount),
        ...batch,
        await this.buildGuard(identifier, walletAddress, afterRequestsCount),
      ]
    }
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
      stableToken.transfer(account, fee.toFixed()).txo
    )
  }
}