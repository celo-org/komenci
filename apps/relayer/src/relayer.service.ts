import { WalletConfig, walletConfig } from '@app/blockchain/config/wallet.config'
import { DistributedBlindedPepperDto } from '@app/onboarding/dto/DistributedBlindedPepperDto'
import { ContractKit, OdisUtils } from '@celo/contractkit'
import {
  AuthSigner,
  ServiceContext
} from '@celo/contractkit/lib/identity/odis/query'
import { replenishQuota } from '@celo/phone-number-privacy-common/lib/test/utils'
import { Inject, Injectable } from '@nestjs/common'
import { appConfig, AppConfig } from './config/app.config'

export interface IRelayerService {
  signPersonalMessage(
    input: SignPersonalMessageInput
  ): Promise<SignPersonalMessageResponse>
  submitTransaction(
    input: SubmitTransactionInput
  ): Promise<SubmitTransactionResponse>
}

@Injectable()
export class RelayerService implements IRelayerService {
  constructor(
    @Inject(ContractKit) private contractKit: ContractKit,
    @Inject(walletConfig.KEY) private walletCfg: WalletConfig,
    @Inject(appConfig.KEY) private appCfg: AppConfig,
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


  async submitTransaction(
    input: SubmitTransactionInput
  ): Promise<SubmitTransactionResponse> {
    return {
      txHash: '<tx-hash>',
      relayerAddress: this.walletCfg.address
    }
  }
}
