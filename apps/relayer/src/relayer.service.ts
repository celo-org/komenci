import { Injectable } from '@nestjs/common';

@Injectable()
export class RelayerService {
  signPersonalMessage(message: Buffer): Promise<string> {
    console.log("I am here")
    return Promise.resolve("signature::"+process.env.PORT)
  }

  submitTransaction(tx: any): Promise<string> {
    return Promise.resolve("tx-hash::"+process.env.PORT)
  }
}
