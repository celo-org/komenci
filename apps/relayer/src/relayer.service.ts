import { CONTRACT_KIT, META_TRANSACTION_WALLET } from '@app/blockchain'
import { WalletConfig, walletConfig } from '@app/blockchain/config/wallet.config'
import { DistributedBlindedPepperDto } from '@app/onboarding/dto/DistributedBlindedPepperDto'
import { ContractKit, OdisUtils } from '@celo/contractkit'
import {
  AuthSigner,
  ServiceContext
} from '@celo/contractkit/lib/identity/odis/query'
import { MetaTransactionWalletWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { replenishQuota } from '@celo/phone-number-privacy-common/lib/test/utils'
import { Inject, Injectable } from '@nestjs/common'
import { appConfig, AppConfig } from './config/app.config'

export type SignPersonalMessageInput = {
  data: string
}

export type SignPersonalMessageResponse = {
  signature: string
  relayerAddress: string
}

export type GetPhoneNumberIdResponse = {
  identifier: string
}

export type SubmitTransactionInput = {
  tx: any
}

export type SubmitTransactionResponse = {
  txHash: string
  relayerAddress: string
}

export interface IRelayerService {
  signPersonalMessage(
    input: SignPersonalMessageInput
  ): Promise<SignPersonalMessageResponse>
  getPhoneNumberIdentifier(
    input: DistributedBlindedPepperDto
  ): Promise<GetPhoneNumberIdResponse>
  submitTransaction(
    input: SubmitTransactionInput
  ): Promise<SubmitTransactionResponse>
}

@Injectable()
export class RelayerService implements IRelayerService {
  constructor(
    @Inject(CONTRACT_KIT) private contractKit: ContractKit,
    @Inject(walletConfig.KEY) private walletCfg: WalletConfig,
    @Inject(appConfig.KEY) private appCfg: AppConfig,
    @Inject(META_TRANSACTION_WALLET) private metaTxWallet: MetaTransactionWalletWrapper
) { }

  async signPersonalMessage(
    input: SignPersonalMessageInput
  ): Promise<SignPersonalMessageResponse> {
    const signature = await this.contractKit.web3.eth.sign(
      input.data,
      this.walletCfg.address,
    )
    return {
      signature,
      relayerAddress: this.walletCfg.address
    }
  }

  // TODO: Relocate this to the onboarding service once we update the ContractKit interface
  // to accept pre-signed auth header (then we can just expose signPersonalMessage)
  async getPhoneNumberIdentifier(
    input: DistributedBlindedPepperDto
  ): Promise<GetPhoneNumberIdResponse> {
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
        return {
          identifier: phoneHashDetails.phoneHash
        }
      } catch (e) {
        // Increase the quota if it's hit
        if (e.message.includes('odisQuotaError')) {
          await replenishQuota(this.walletCfg.address, this.contractKit)
        } else {
          throw new Error('Unable to query ODIS due to unexpected error')
        }
      }
    }
    throw new Error('Unable to query ODIS due to out of quota error')
  }

  async submitTransaction(
    input: SubmitTransactionInput
  ): Promise<SubmitTransactionResponse> {
    return {
      txHash: '<tx-hash>',
      relayerAddress: this.walletCfg.address
    }
  }
}
