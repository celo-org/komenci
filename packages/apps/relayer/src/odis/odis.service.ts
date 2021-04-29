import { Err, Ok, Result, RootError } from '@celo/base/lib/result'
import { ContractKit } from '@celo/contractkit'
import { OdisUtils } from '@celo/identity'
import { AuthSigner, ServiceContext } from '@celo/identity/lib/odis/query'
import { WalletConfig, walletConfig } from '@komenci/blockchain/dist/config/wallet.config'
import { networkConfig, NetworkConfig } from '@komenci/core'
import { retry } from '@komenci/kit/lib/retry'
import { KomenciLoggerService } from '@komenci/logger'
import { Inject, Injectable } from '@nestjs/common'
import { appConfig, AppConfig } from '../config/app.config'
import { GetPhoneNumberSignatureDto } from '../dto/GetPhoneNumberSignatureDto'

export enum OdisQueryErrorTypes {
  OutOfQuota = "OutOfQuota",
  Timeout = "Timeout",
  Unknown = "Unknown"
}

export class OdisOutOfQuotaError extends RootError<OdisQueryErrorTypes.OutOfQuota> {
  constructor() {
    super(OdisQueryErrorTypes.OutOfQuota)
  }
}

export class OdisUnknownError extends RootError<OdisQueryErrorTypes.Unknown> {
  constructor(public odisError: Error) {
    super(OdisQueryErrorTypes.Unknown)
  }
}

export class OdisTimeoutError extends RootError<OdisQueryErrorTypes.Timeout> {
  constructor() {
    super(OdisQueryErrorTypes.Timeout)
  }
}

export type OdisQueryError = OdisOutOfQuotaError | OdisUnknownError | OdisTimeoutError

@Injectable()
export class OdisService {
  private authSigner : AuthSigner
  private serviceContext: ServiceContext

  constructor(
    private contractKit: ContractKit,
    @Inject(walletConfig.KEY) private walletCfg: WalletConfig,
    @Inject(networkConfig.KEY) private networkCfg: NetworkConfig,
    @Inject(appConfig.KEY) private appCfg: AppConfig,
    private logger: KomenciLoggerService
  ) {
    this.authSigner = {
      authenticationMethod: OdisUtils.Query.AuthenticationMethod.WALLET_KEY,
      contractKit: this.contractKit
    }

    this.serviceContext = {
      odisUrl: this.networkCfg.odis.url,
      odisPubKey: this.networkCfg.odis.publicKey
    }
  }

  // TODO: Relocate this to the onboarding service once we update the ContractKit interface
  // to accept pre-signed auth header (then we can just expose signPersonalMessage)
  @retry({
    bailOnErrorTypes: [
      OdisQueryErrorTypes.Unknown
    ],
    tries: 2,
  })
  async getPhoneNumberSignature(
    input: GetPhoneNumberSignatureDto,
  ): Promise<Result<string, OdisQueryError>> {
    const timeout = new Promise<Result<string, OdisTimeoutError>>(
      resolve => setTimeout(
        () => resolve(Err(new OdisTimeoutError())),
        this.appCfg.odisTimeoutMs
      )
    )
    const res = await Promise.race([
      this.queryOdis(input),
      timeout
    ])

    if (res.ok === false) {
      this.logger.errorWithContext(res.error, input.context)
      if (res.error.errorType === OdisQueryErrorTypes.OutOfQuota) {
        // Cody TODO: Reinstate once merge with mono is ready
        // await replenishQuota(this.walletCfg.address, this.contractKit)
        const goldToken = await this.contractKit.contracts.getGoldToken()
        const selfTransferTx = goldToken.transfer(this.walletCfg.address, 1)
        await selfTransferTx.sendAndWaitForReceipt({from: this.walletCfg.address})
      }
    }

    return res
  }


  private async queryOdis(
    input: GetPhoneNumberSignatureDto
  ): Promise<Result<string, OdisQueryError>> {
    try {
      const signature = await OdisUtils.PhoneNumberIdentifier.getBlindedPhoneNumberSignature(
        this.walletCfg.address,
        this.authSigner,
        this.serviceContext,
        input.blindedPhoneNumber,
        undefined,
        input.clientVersion
      )
      return Ok(signature)
    } catch (e) {
      if (e.message.includes('odisQuotaError')) {
        return Err(new OdisOutOfQuotaError())
      } else {
        return Err(new OdisUnknownError(e))
      }
    }
  }
}