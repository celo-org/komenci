import { BlockchainModule } from '@komenci/blockchain/dist/blockchain.module'
import { NodeProviderType } from '@komenci/blockchain/dist/config/node.config'
import { WalletConfig } from '@komenci/blockchain/dist/config/wallet.config'
import { ContractsModule } from '@komenci/blockchain/dist/contracts.module'
import { FundingService } from '@komenci/blockchain/dist/funding.service'
import { NetworkConfig, networkConfig } from '@komenci/core'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ConsoleModule } from 'nestjs-console'
import { LoggerModule } from 'nestjs-pino'
import { DeployerCommand } from './deployer.command'
import { FundCommand } from './fund.command'
import { fundConfig } from './fund.config'

@Module({
  imports: [
    ConsoleModule,
    LoggerModule.forRoot({
      pinoHttp: {
        prettyPrint: true
      }
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [networkConfig, fundConfig],
      envFilePath: [
        './.env.local',
        './.env',
      ]
    }),
    BlockchainModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const networkCfg = config.get<NetworkConfig>('network')
        const fundCfg = config.get<WalletConfig>('fund')

        return {
          node: {
            providerType: NodeProviderType.HTTP,
            url: networkCfg.fornoURL
          },
          wallet: fundCfg
        }
      }
    }),
    ContractsModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const networkCfg = config.get<NetworkConfig>('network')

        return {
          deployerAddress: networkCfg.contracts.MetaTransactionWalletDeployer,
        }
      },
    }),
  ],
  providers: [
    FundingService,
    FundCommand,
    DeployerCommand,
  ],
})
export class ToolsModule {}
