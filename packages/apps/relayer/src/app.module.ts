import { BlockchainModule, ContractsModule } from '@komenci/blockchain'
import { NodeProviderType } from '@komenci/blockchain/dist/config/node.config'
import { WalletConfig, walletConfig } from '@komenci/blockchain/dist/config/wallet.config'
import { KomenciLoggerModule } from '@komenci/logger'
import { NetworkConfig, networkConfig } from '@komenci/core'
import { HttpModule, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { BalanceService } from './chain/balance.service'
import { loggerConfigFactory } from './logger-config.factory'
import { OdisService } from './odis/odis.service'
import { AppController } from './app.controller'
import { TransactionService } from './chain/transaction.service'
import { appConfig, AppConfig } from './config/app.config'
import { metaTransactionWalletProvider } from './contracts/MetaTransactionWallet.contract'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, networkConfig, walletConfig],
      envFilePath: [
        './.env.local',
        './.env',
      ]
    }),
    BlockchainModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const networkCfg = config.get<NetworkConfig>('network')
        return {
          node: {
            providerType: NodeProviderType.HTTP,
            url: networkCfg.fornoURL
          },
          wallet: config.get<WalletConfig>('wallet'),
        }
      }
    }),
    ContractsModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const wallet = config.get<WalletConfig>('wallet')
        const network = config.get<NetworkConfig>('network')

        return {
          deployerAddress: network.contracts.MetaTransactionWalletDeployer,
          walletAddress: wallet.address
        }
      }
    }),
    KomenciLoggerModule.forRootAsync({
      providers: [ConfigService],
      inject: [ConfigService],
      useFactory: loggerConfigFactory
    }),
    HttpModule
  ],
  controllers: [AppController],
  providers: [
    OdisService,
    TransactionService,
    BalanceService,
    metaTransactionWalletProvider,
  ]
})
export class AppModule {}
