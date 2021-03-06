import { Ok, Result } from '@celo/base/lib/result'
import { CeloContract, ContractKit } from '@celo/contractkit'
import { RawTransaction, toRawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { RawTransactionDto } from '@komenci/relayer/dist/dto/RawTransactionDto'
import { Injectable } from '@nestjs/common'
import { RequestAttestationsDto } from '../dto/RequestAttestationsDto'
import { Session } from '../session/session.entity'
import { InvalidWallet, TxParseErrors } from '../wallet/errors'
import { MethodFilter } from '../wallet/method-filter'
import { TxParserService } from '../wallet/tx-parser.service'
import { WalletService } from '../wallet/wallet.service'

@Injectable()
export class SubsidyService {
  constructor(
    private readonly walletService: WalletService,
    private readonly txParserService: TxParserService,
    private readonly contractKit: ContractKit,
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


    const requestTxRes = await this.txParserService.parse(
      input.requestTx,
      input.walletAddress,
      new MethodFilter().addContract(
        CeloContract.Attestations,
        await this.contractKit.contracts.getAttestations(),
        ["request"]
      )
    )

    if (requestTxRes.ok === false) {
      return requestTxRes
    }

    if (input.approveTx !== undefined) {
      const approveTxRes = await this.txParserService.parse(
        input.approveTx,
        input.walletAddress,
        new MethodFilter().addContract(
          CeloContract.StableToken,
          await this.contractKit.contracts.getStableToken(),
          ["approve"]
        )
      )

      if (approveTxRes.ok === false) {
        return approveTxRes
      }
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
      requestTx,
      approveTx
    } = input

    const batch: RawTransactionDto[] = []
    batch.push(await this.buildSubsidyTransfer(attestationsRequested, walletAddress))
    if (approveTx !== undefined) {
      batch.push(approveTx)
    }
    batch.push(requestTx)
    return batch
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
