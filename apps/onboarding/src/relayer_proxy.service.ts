import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class RelayerProxyService {
  constructor(
    @Inject('RELAYER_SERVICE') private client: ClientProxy,
  ) {}

  async signPersonalMessage(message: Buffer): Promise<string> {
    return this.client.send<string>({cmd: `signPersonalMessage`}, message).toPromise()
  }

  async submitTransaction(tx: any): Promise<string> {
    return this.client.send<string>({cmd: `submitTransaction`}, tx).toPromise()
  }
}
