import { IsCeloAddress } from '@komenci/core'

export class DeployWalletDto {
  @IsCeloAddress()
  implementationAddress: string
}
