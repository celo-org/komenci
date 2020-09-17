import { Inject, Injectable } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import appConfig from './config/app.config'

export type SignPersonalMessageInput = {
  data: Buffer
}
export type SignPersonalMessageResponse = {
  signature: Buffer
  relayerAddress: string
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
  submitTransaction(input: SubmitTransactionInput): Promise<SubmitTransactionResponse>
}

@Injectable()
export class RelayerService implements IRelayerService {
  constructor(
    @Inject(appConfig.KEY)
    private config: ConfigType<typeof appConfig>
  ) {}
  async signPersonalMessage(input: SignPersonalMessageInput): Promise<SignPersonalMessageResponse> {
    return {
      signature: Buffer.alloc(0),
      relayerAddress: this.config.address
    }
  }

  async submitTransaction(input: SubmitTransactionInput): Promise<SubmitTransactionResponse> {
    return {
      txHash: "<tx-hash>",
      relayerAddress: this.config.address
    }
  }
}
