import { IsCeloAddress } from '@app/onboarding/utils/validators'

export class DeployWalletDto {
  @IsCeloAddress()
  implementationAddress: string
}
