import { BlockchainModule, ContractsModule } from '@app/blockchain'
import { NodeProviderType } from '@app/blockchain/config/node.config'
import { WalletConfig, WalletType } from '@app/blockchain/config/wallet.config'
import { NetworkConfig, networkConfig } from '@app/utils/config/network.config'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { DeployerCommand } from 'apps/tools/src/deployer.command'
import { fundConfig } from 'apps/tools/src/fund.config'
import { ConsoleModule } from 'nestjs-console'
import { LoggerModule } from 'nestjs-pino'
import { FundCommand } from './fund.command'

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
        'apps/tools/.env.local',
        'apps/tools/.env',
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
    FundCommand,
    DeployerCommand,
  ],
})
export class ToolsModule {}
