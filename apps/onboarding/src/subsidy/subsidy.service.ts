import { AppConfig, appConfig } from '@app/onboarding/config/app.config'
import { RequestAttestationsDto } from '@app/onboarding/dto/RequestAttestationsDto'
import { InvalidWallet, TxParseErrors } from '@app/onboarding/wallet/errors'
import { MethodFilter } from '@app/onboarding/wallet/method-filter'
import { TxParserService } from '@app/onboarding/wallet/tx-parser.service'
import { WalletService } from '@app/onboarding/wallet/wallet.service'
import { Ok, Result } from '@celo/base/lib/result'
import { CeloContract, ContractKit } from '@celo/contractkit'
import { RawTransaction, toRawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { Inject, Injectable, OnModuleInit, Scope } from '@nestjs/common'
import { RawTransactionDto } from 'apps/relayer/src/dto/RawTransactionDto'
import { Session } from '../session/session.entity'

export class SubsidyService {
  constructor(
    private readonly walletService: WalletService,
    private readonly txParserService: TxParserService,
    private readonly contractKit: ContractKit,
    @Inject(appConfig.KEY)
    private readonly cfg: AppConfig
  ) {}

  public async isValid(
    input: RequestAttestationsDto,
    session: Session
  ): Promise<Result<boolean, InvalidWallet | TxParseErrors>> {
    const walletValid = await this.walletService.isValidWallet(
      input.walletAddress,
      session.externalAccount
    )

    if (walletValid.ok === false) {
      return walletValid
    }


    const res = await this.txParserService.parse(
      input.requestTx,
      input.walletAddress,
      new MethodFilter().addContract(
        CeloContract.Accounts,
        await this.contractKit.contracts.getAttestations(),
        ["request"]
      )
    )

    if (res.ok === false) {
      return res
    }
    return Ok(true)
  }

  public async buildTransactionBatch(
    input: RequestAttestationsDto
  ): Promise<RawTransaction[]> {
    const {
      identifier,
      walletAddress,
      attestationsRequested,
      requestTx
    } = input

    const batch = [
      await this.buildSubsidyTransfer(attestationsRequested, walletAddress),
      requestTx
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
        walletAddress
      )
      const afterRequestsCount = beforeRequestsCount + attestationsRequested

      return [
        await this.buildGuard(identifier, walletAddress, beforeRequestsCount),
        ...batch,
        await this.buildGuard(identifier, walletAddress, afterRequestsCount)
      ]
    }
  }

  private async getCurrentRequestedAttestations(
    identifier: string,
    account: string
  ): Promise<number> {
    const attestations = await this.contractKit.contracts.getAttestations()
    const stats = await attestations.getAttestationStat(identifier, account)
    return stats.total
  }

  private async buildGuard(
    identifier: string,
    account: string,
    count: number
  ): Promise<RawTransactionDto> {
    const attestations = await this.contractKit.contracts.getAttestations()
    return toRawTransaction(
      (attestations as any).requireNAttestationsRequested(
        identifier,
        account,
        count
      ).txo
    )
  }

  private async buildSubsidyTransfer(
    attestationsRequested: number,
    account: string
  ): Promise<RawTransactionDto> {
    const attestations = await this.contractKit.contracts.getAttestations()
    const stableToken = await this.contractKit.contracts.getStableToken()
    const fee = await attestations.getAttestationFeeRequired(
      attestationsRequested
    )
    return toRawTransaction(stableToken.transfer(account, fee.toFixed()).txo)
  }
}
