import { BlockchainOptions } from '@app/blockchain/blockchain.module'
import { NodeProviderType } from '@app/blockchain/config/node.config'
import { WalletType } from '@app/blockchain/config/wallet.config'
import { ContractKit } from '@celo/contractkit'
import { AzureHSMWallet } from '@celo/contractkit/lib/wallets/azure-hsm-wallet'
import { LocalWallet } from '@celo/contractkit/lib/wallets/local-wallet'
import { ReadOnlyWallet, Wallet } from '@celo/contractkit/lib/wallets/wallet'
import { FactoryProvider } from '@nestjs/common'
import Web3 from 'web3'
import { provider } from 'web3-core'

export const BLOCKCHAIN_MODULE_OPTIONS = 'BLOCKCHAIN_MODULE_OPTIONS'
export const WEB3_PROVIDER = 'WEB3_PROVIDER'
export const WALLET = 'WALLET'

export const web3ProviderDef: FactoryProvider<provider> = {
  provide: WEB3_PROVIDER,
  useFactory: (options: BlockchainOptions) => {
    switch (options.node.providerType) {
      case NodeProviderType.HTTP:
        return new Web3.providers.HttpProvider(options.node.url)
      case NodeProviderType.WS:
        return new Web3.providers.WebsocketProvider(options.node.url)
      case NodeProviderType.IPC:
        return new Web3.providers.IpcProvider(options.node.url, require('net'))
      default:
        throw Error(`Invalid NodeProviderType: ${options.node.providerType}`)
    }
  },
  inject: [BLOCKCHAIN_MODULE_OPTIONS]
}

export const walletDef: FactoryProvider<ReadOnlyWallet> = {
  provide: WALLET,
  useFactory: (options: BlockchainOptions) => {
    switch (options.wallet.type) {
      case WalletType.AzureHSM:
        return new AzureHSMWallet(options.wallet.vaultName)
      case WalletType.Local:
        const localWallet = new LocalWallet()
        localWallet.addAccount(options.wallet.privateKey)
        return localWallet
    }
  },
  inject: [BLOCKCHAIN_MODULE_OPTIONS]
}

export const web3Def: FactoryProvider<Web3> = {
  provide: Web3,
  useFactory: (web3Provider: provider) => {
    return new Web3(web3Provider)
  },
  inject: [WEB3_PROVIDER]
}

export const contractKitDef: FactoryProvider<ContractKit> = {
  provide: ContractKit,
  useFactory: (web3: Web3, wallet: Wallet) => {
    return new ContractKit(web3, wallet)
  },
  inject: [Web3, WALLET]
}


