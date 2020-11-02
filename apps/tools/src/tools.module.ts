import { BlockchainModule, ContractsModule } from '@app/blockchain'
import { NodeProviderType } from '@app/blockchain/config/node.config'
import { WalletType } from '@app/blockchain/config/wallet.config'
import { NetworkConfig, networkConfig } from '@app/utils/config/network.config'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { DeployerCommand } from 'apps/tools/src/deployer.command'
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
      load: [networkConfig],
      envFilePath: [
        'apps/tools/.env.local',
        'apps/tools/.env',
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
          wallet: {
            type: WalletType.Local,
            address: networkCfg.fund.address,
            privateKey: networkCfg.fund.privateKey,
          }
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
