import { Injectable } from '@nestjs/common';

export type SignPersonalMessageResponse = {
  signature: Buffer
  relayerAddress: string
}

export type SubmitTransactionResponse = {
  txHash: string
  relayerAddress: string
}

@Injectable()
export class RelayerService {
  async signPersonalMessage(message: Buffer): Promise<SignPersonalMessageResponse> {
    return Promise.resolve({
      signature: Buffer.alloc(0),
      relayerAddress: process.env.ADDRESS
    })
  }

  async submitTransaction(tx: any): Promise<SubmitTransactionResponse> {
    return Promise.resolve({
      txHash: "<tx-hash>",
      relayerAddress: process.env.ADDRESS
    })
  }
}
