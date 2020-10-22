import { WalletConfig, walletConfig } from '@app/blockchain/config/wallet.config'
import { DistributedBlindedPepperDto } from '@app/onboarding/dto/DistributedBlindedPepperDto'
import { Err, Ok, Result, RootError } from '@celo/base/lib/result'
import { ContractKit, OdisUtils } from '@celo/contractkit'
import { AuthSigner, ServiceContext } from '@celo/contractkit/lib/identity/odis/query'
import { replenishQuota } from '@celo/phone-number-privacy-common/lib/test/utils'
import { Inject, Injectable } from '@nestjs/common'
import { AppConfig, appConfig } from 'apps/relayer/src/config/app.config'

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

export type GetPhoneNumberIdResponse = {
  identifier: string
}

@Injectable()
export class OdisService {
  constructor(
    private contractKit: ContractKit,
    @Inject(walletConfig.KEY) private walletCfg: WalletConfig,
    @Inject(appConfig.KEY) private appCfg: AppConfig,
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

    const { odisPubKey, odisUrl } = this.appCfg.networkConfig
    const serviceContext: ServiceContext = {
      odisUrl,
      odisPubKey
    }

    // Query the phone number identifier
    // Re-attempt once if the
    let attempts = 0
    while (attempts++ <= 1) {
      try {
        const phoneHashDetails = await OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
          input.e164Number,
          this.walletCfg.address,
          authSigner,
          serviceContext,
          undefined,
          input.clientVersion
        )
        return Ok(phoneHashDetails.phoneHash)
      } catch (e) {
        // Increase the quota if it's hit
        if (e.message.includes('odisQuotaError')) {
          console.log(e)
          await replenishQuota(this.walletCfg.address, this.contractKit)
        } else {
          return Err(new OdisUnknownError(e))
        }
      }
    }
    return Err(new OdisOutOfQuotaError())
  }
}
