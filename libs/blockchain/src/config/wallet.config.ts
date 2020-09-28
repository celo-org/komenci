import { registerAs } from '@nestjs/config'

export enum WalletType {
  Local = "local",
  AzureHSM = "azure-hsm",
}

export interface BaseWalletConfig {
  address: string
  metaTransactionWalletAddress: string
}

export interface LocalWalletConfig extends BaseWalletConfig {
  type: WalletType.Local,
  privateKey: string
}

export interface AzureHSMWalletConfig extends BaseWalletConfig {
  type: WalletType.AzureHSM,
  vaultName: string,
}

export type WalletConfig = LocalWalletConfig | AzureHSMWalletConfig

export const walletConfig = registerAs('wallet', (): WalletConfig => {
  const type = process.env.WALLET_TYPE as WalletType
  const baseConfig: BaseWalletConfig = {
    address: process.env.WALLET_ADDRESS,
    metaTransactionWalletAddress: process.env.META_TRANSACTION_WALLET_ADDRESS
  }

  if (type === WalletType.AzureHSM) {
    return {
      ...baseConfig,
      type,
      vaultName: process.env.WALLET_AZURE_VAULT_NAME,
    }
  } else if (type === WalletType.Local) {
    return {
      ...baseConfig,
      type,
      privateKey: process.env.WALLET_PRIVATE_KEY
    }
  } else {
    throw Error(`Invalid wallet type: ${type}`)
  }
})

