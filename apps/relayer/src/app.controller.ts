import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { RelayerService, SignPersonalMessageResponse, SubmitTransactionResponse } from './relayer.service';

@Controller()
export class AppController {
  constructor(private readonly relayerService: RelayerService) {}

  @MessagePattern({ cmd: 'signPersonalMessage' })
  async signPersonalMessage(data: Buffer): Promise<SignPersonalMessageResponse> {
    return this.relayerService.signPersonalMessage(data)
  }

  @MessagePattern({cmd: 'submitTransaction'})
  async submitTransaction(tx: unknown): Promise<SubmitTransactionResponse> {
    return this.relayerService.submitTransaction(tx)
  }
}
