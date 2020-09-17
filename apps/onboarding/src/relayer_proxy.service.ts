import { Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { DistributedBlindedPepperDto } from 'apps/onboarding/src/dto/DistributedBlindedPepperDto'
import {
  GetPhoneNumberIdResponse,
  IRelayerService,
  SignPersonalMessageInput,
  SignPersonalMessageResponse,
  SubmitTransactionInput,
  SubmitTransactionResponse
} from 'apps/relayer/src/relayer.service'

@Injectable()
export class RelayerProxyService implements IRelayerService {
  constructor(@Inject('RELAYER_SERVICE') private client: ClientProxy) {}

  async signPersonalMessage(
    input: SignPersonalMessageInput
  ): Promise<SignPersonalMessageResponse> {
    return this.client.send({ cmd: `signPersonalMessage` }, input).toPromise()
  }

  async getPhoneNumberIdentifier(
    input: DistributedBlindedPepperDto
  ): Promise<GetPhoneNumberIdResponse> {
    return this.client
      .send({ cmd: `getPhoneNumberIdentifier` }, input)
      .toPromise()
  }

  async submitTransaction(
    input: SubmitTransactionInput
  ): Promise<SubmitTransactionResponse> {
    return this.client.send({ cmd: `submitTransaction` }, input).toPromise()
  }
}
