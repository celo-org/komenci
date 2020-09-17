import { Controller } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import { DistributedBlindedPepperDto } from '../../onboarding/src/dto/DistributedBlindedPepperDto'
import {
  GetPhoneNumberIdResponse,
  RelayerService,
  SignPersonalMessageInput,
  SignPersonalMessageResponse,
  SubmitTransactionInput,
  SubmitTransactionResponse
} from './relayer.service'

@Controller()
export class AppController {
  constructor(private readonly relayerService: RelayerService) {}

  @MessagePattern({ cmd: 'signPersonalMessage' })
  async signPersonalMessage(
    input: SignPersonalMessageInput
  ): Promise<SignPersonalMessageResponse> {
    return this.relayerService.signPersonalMessage(input)
  }

  @MessagePattern({ cmd: 'getPhoneNumberIdentifier' })
  async getPhoneNumberIdentifier(
    input: DistributedBlindedPepperDto
  ): Promise<GetPhoneNumberIdResponse> {
    return this.relayerService.getPhoneNumberIdentifier(input)
  }

  @MessagePattern({ cmd: 'submitTransaction' })
  async submitTransaction(
    input: SubmitTransactionInput
  ): Promise<SubmitTransactionResponse> {
    return this.relayerService.submitTransaction(input)
  }
}
