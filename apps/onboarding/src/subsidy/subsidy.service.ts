import { AppConfig, appConfig } from '@app/onboarding/config/app.config'
import { RequestAttestationsDto } from '@app/onboarding/dto/RequestAttestationsDto'
import { InvalidMetaTransaction, SubsidyError, WalletSignerMismatchError } from '@app/onboarding/subsidy/errors'
import { normalizeAddress } from '@celo/base/lib'
import { Err, Ok, Result } from '@celo/base/lib/result'
import { ContractKit } from '@celo/contractkit'
import { RawTransaction, toRawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { Inject, Injectable } from '@nestjs/common'
import { RawTransactionDto } from 'apps/relayer/src/dto/RawTransactionDto'
import { Session } from '../session/session.entity'

@Injectable()
export class SubsidyService {
  constructor(
    private readonly contractKit: ContractKit,
    @Inject(appConfig.KEY)
    private readonly cfg: AppConfig
  ) {}

  public async isValid(
    input: RequestAttestationsDto,
    session: Session
  ): Promise<Result<boolean, SubsidyError>> {
    const wallet = await this.contractKit.contracts.getMetaTransactionWallet(
      input.walletAddress
    )
    const signer = normalizeAddress(await wallet.signer())
    if (signer !== normalizeAddress(session.externalAccount)) {
      return Err(new WalletSignerMismatchError(signer, session.externalAccount))
    }

    // TODO: extend this to be more rigid when we have generalised
    // logic that can decode incoming meta transactions
    if (normalizeAddress(input.transactions.approve.destination) !== normalizeAddress(input.walletAddress)) {
      return Err(new InvalidMetaTransaction("subsidyRequest:approve"))
    }

    if (normalizeAddress(input.transactions.request.destination) !== normalizeAddress(input.walletAddress)) {
      return Err(new InvalidMetaTransaction("subsidyRequest:request"))
    }


    return Ok(true)
  }

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