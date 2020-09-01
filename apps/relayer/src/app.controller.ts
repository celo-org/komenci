import { Controller, Get } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { RelayerService } from './relayer.service';

@Controller()
export class AppController {
  constructor(private readonly relayerService: RelayerService) {}

  @MessagePattern({ cmd: 'signPersonalMessage' })
  async signPersonalMessage(data: Buffer): Promise<string> {
    return this.relayerService.signPersonalMessage(data)
  }

  @MessagePattern({cmd: 'submitTransaction'})
  async submitTransaction(tx: unknown): Promise<string> {
    return this.relayerService.submitTransaction(tx)
  }
}
