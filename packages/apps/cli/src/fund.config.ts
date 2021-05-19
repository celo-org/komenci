import { WalletConfig, WalletType } from '@komenci/blockchain/dist/config/wallet.config'
import { registerAs } from '@nestjs/config'

export const fundConfig = registerAs<() => WalletConfig>('fund', () => {
  return {
    type: WalletType.AzureHSM,
    address: process.env.FUND_ADDRESS,
    vaultName: process.env.AZURE_VAULT_NAME,
    keyName: process.env.AZURE_KEY_NAME
  }
})
