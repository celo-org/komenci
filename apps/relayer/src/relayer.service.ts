import { OdisUtils } from '@celo/contractkit'
import { PhoneNumberHashDetails } from '@celo/contractkit/lib/identity/odis/phone-number-identifier'
import { AuthSigner, ServiceContext } from '@celo/contractkit/lib/identity/odis/query'
import { Inject, Injectable } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { DistributedBlindedPepperDto } from 'apps/onboarding/src/dto/DistributedBlindedPepperDto'
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
  signPersonalMessage(input: SignPersonalMessageInput): Promise<SignPersonalMessageResponse>
  getPhoneNumberIdentifier(input: DistributedBlindedPepperDto): Promise<GetPhoneNumberIdResponse>
  submitTransaction(input: SubmitTransactionInput): Promise<SubmitTransactionResponse>
}

@Injectable()
export class RelayerService implements IRelayerService {
  static async getContractKitManager(): Promise<ContractKitManager> {
    if (!RelayerService.contractKitManager) {
      RelayerService.contractKitManager = new ContractKitManager(RelayerService.config)
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

  async signPersonalMessage(input: SignPersonalMessageInput) {
    const relayerAddress = RelayerService.config.address
    const contractKitManager = await RelayerService.getContractKitManager()
    const contractKit = await contractKitManager.kit
    const signature = await contractKit.web3.eth.sign(input.data, relayerAddress)
    return {
      signature,
      relayerAddress: relayerAddress
    }
  }

  // TODO: Relocate this to the onboarding service once we update the ContractKit interface
  // to accept pre-signed auth header (then we can just expose signPersonalMessage)
  async getPhoneNumberIdentifier(input: DistributedBlindedPepperDto): Promise<GetPhoneNumberIdResponse> {
    const contractKitManager = await RelayerService.getContractKitManager()
    const contractKit = await contractKitManager.kit
    const authSigner: AuthSigner = {
      authenticationMethod: OdisUtils.Query.AuthenticationMethod.WALLET_KEY,
      contractKit,
    }

    const { odisPubKey, odisUrl } = RelayerService.config.networkConfig
    const serviceContext: ServiceContext = {
      odisUrl,
      odisPubKey,
    }

    try {
      // FAILS
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
    }
    catch (e) {
      // TODO: handle failures
      console.log(e)
    }
  }

  async submitTransaction(input: SubmitTransactionInput) {
    return {
      txHash: "<tx-hash>",
      relayerAddress: this.config.address
    }
  }
}
