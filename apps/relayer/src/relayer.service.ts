import { Injectable } from '@nestjs/common';

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
  async signPersonalMessage(input: SignPersonalMessageInput) {
    return {
      signature: Buffer.alloc(0),
      relayerAddress: process.env.ADDRESS
    }
  }

  async submitTransaction(input: SubmitTransactionInput) {
    return {
      txHash: "<tx-hash>",
      relayerAddress: process.env.ADDRESS
    }
  }
}
