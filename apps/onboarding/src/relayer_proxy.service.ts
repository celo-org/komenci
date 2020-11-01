import { Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { DistributedBlindedPepperDto } from 'apps/onboarding/src/dto/DistributedBlindedPepperDto'
import { RelayerResponse } from 'apps/relayer/src/app.controller'
import { SignPersonalMessageDto } from 'apps/relayer/src/dto/SignPersonalMessageDto'
import { SubmitTransactionBatchDto } from 'apps/relayer/src/dto/SubmitTransactionBatchDto'
import { SubmitTransactionDto } from 'apps/relayer/src/dto/SubmitTransactionDto'

@Injectable()
export class RelayerProxyService {
  constructor(@Inject('RELAYER_SERVICE') private client: ClientProxy) {}

  async signPersonalMessage(
    input: SignPersonalMessageDto
  ): Promise<RelayerResponse<string>> {
    return this.client.send({ cmd: `signPersonalMessage` }, input).toPromise()
  }

  async getPhoneNumberIdentifier(
    input: DistributedBlindedPepperDto
  ): Promise<RelayerResponse<string>> {
    return this.client
      .send({ cmd: `getPhoneNumberIdentifier` }, input)
      .toPromise()
  }

  async submitTransaction(
    input: SubmitTransactionDto
  ): Promise<RelayerResponse<string>> {
    return this.client.send({ cmd: `submitTransaction` }, input).toPromise()
  }

  async submitTransactionBatch(
    input: SubmitTransactionBatchDto
  ): Promise<RelayerResponse<string>> {
    return this.client.send({ cmd: `submitTransactionBatch` }, input).toPromise()
  }
}
