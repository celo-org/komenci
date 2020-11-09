import { WalletConfig, walletConfig } from '@app/blockchain/config/wallet.config'
import { KomenciLoggerService } from '@app/komenci-logger'
import { DistributedBlindedPepperDto } from '@app/onboarding/dto/DistributedBlindedPepperDto'
import { networkConfig, NetworkConfig } from '@app/utils/config/network.config'
import { Err, Ok, Result, RootError } from '@celo/base/lib/result'
import { ContractKit, OdisUtils } from '@celo/contractkit'
import { AuthSigner, ServiceContext } from '@celo/contractkit/lib/identity/odis/query'
import { replenishQuota } from '@celo/phone-number-privacy-common/lib/test/utils'
import { Inject, Injectable } from '@nestjs/common'

export enum OdisQueryErrorTypes {
  OutOfQuota = "OutOfQuota",
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

export type OdisQueryError = OdisOutOfQuotaError | OdisUnknownError

@Injectable()
export class OdisService {
  constructor(
    private contractKit: ContractKit,
    private logger: KomenciLoggerService,
    @Inject(walletConfig.KEY) private walletCfg: WalletConfig,
    @Inject(networkConfig.KEY) private networkCfg: NetworkConfig,
  ) {}

  // TODO: Relocate this to the onboarding service once we update the ContractKit interface
  // to accept pre-signed auth header (then we can just expose signPersonalMessage)
  getPhoneNumberIdentifier = async (
    input: DistributedBlindedPepperDto
  ): Promise<Result<string, OdisQueryError>> => {
    const authSigner: AuthSigner = {
      authenticationMethod: OdisUtils.Query.AuthenticationMethod.WALLET_KEY,
      contractKit: this.contractKit
    }

    const serviceContext: ServiceContext = {
      odisUrl: this.networkCfg.odis.url,
      odisPubKey: this.networkCfg.odis.publicKey
    }

    // Query the phone number identifier
    // Re-attempt once if the
    let attempts = 0
    while (attempts++ <= 1) {
      try {
        const combinedSignature = await OdisUtils.PhoneNumberIdentifier.getBlindedPhoneNumberSignature(
          this.walletCfg.address,
          authSigner,
          serviceContext,
          input.blindedPhoneNumber,
          undefined,
          input.clientVersion
        )
        return Ok(combinedSignature)
      } catch (e) {
        // Increase the quota if it's hit
        if (e.message.includes('odisQuotaError')) {
          this.logger.error(e)
          await replenishQuota(this.walletCfg.address, this.contractKit)
        } else {
          return Err(new OdisUnknownError(e))
        }
      }
    }
    return Err(new OdisOutOfQuotaError())
  }
}
