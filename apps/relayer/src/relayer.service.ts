import { OdisUtils } from '@celo/contractkit'
import {
  AuthSigner,
  ServiceContext
} from '@celo/contractkit/lib/identity/odis/query'
import { replenishQuota } from '@celo/phone-number-privacy-common/lib/test/utils'
import { Inject, Injectable } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { DistributedBlindedPepperDto } from '../../onboarding/src/dto/DistributedBlindedPepperDto'
import appConfig from './config/app.config'
import { ContractKitManager } from './wallet/contractkit-manager'

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
  static async getContractKitManager(): Promise<ContractKitManager> {
    if (!RelayerService.contractKitManager) {
      RelayerService.contractKitManager = new ContractKitManager(
        RelayerService.config
      )
      await RelayerService.contractKitManager.init()
    }
    return RelayerService.contractKitManager
  }
  private static contractKitManager: ContractKitManager
  private static config: ConfigType<typeof appConfig>

  constructor(
    @Inject(appConfig.KEY)
    private config: ConfigType<typeof appConfig>
  ) {
    RelayerService.config = config
  }

  async signPersonalMessage(
    input: SignPersonalMessageInput
  ): Promise<SignPersonalMessageResponse> {
    const relayerAddress = RelayerService.config.address
    const contractKitManager = await RelayerService.getContractKitManager()
    const contractKit = await contractKitManager.kit
    const signature = await contractKit.web3.eth.sign(
      input.data,
      relayerAddress
    )
    return {
      signature,
      relayerAddress: relayerAddress
    }
  }

  // TODO: Relocate this to the onboarding service once we update the ContractKit interface
  // to accept pre-signed auth header (then we can just expose signPersonalMessage)
  async getPhoneNumberIdentifier(
    input: DistributedBlindedPepperDto
  ): Promise<GetPhoneNumberIdResponse> {
    const contractKitManager = await RelayerService.getContractKitManager()
    const contractKit = await contractKitManager.kit
    const authSigner: AuthSigner = {
      authenticationMethod: OdisUtils.Query.AuthenticationMethod.WALLET_KEY,
      contractKit
    }

    const { odisPubKey, odisUrl } = RelayerService.config.networkConfig
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
          RelayerService.config.address,
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
          await replenishQuota(RelayerService.config.address, contractKit)
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
      relayerAddress: this.config.address
    }
  }
}
