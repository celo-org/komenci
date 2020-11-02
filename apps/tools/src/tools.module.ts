import { BlockchainModule, ContractsModule } from '@app/blockchain'
import { NodeProviderType } from '@app/blockchain/config/node.config'
import { WalletConfig, WalletType } from '@app/blockchain/config/wallet.config'
import { NetworkConfig, networkConfig } from '@app/utils/config/network.config'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ContractDeployerConfig, contractDeployerConfig } from 'apps/tools/src/config/contractDeployer.config'
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
      load: [networkConfig, contractDeployerConfig],
      envFilePath: [
        'apps/tools/.env.local',
        'apps/tools/.env',
      ]
    }),
    BlockchainModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const networkCfg = config.get<NetworkConfig>('network')
        const contractDeployerCfg = config.get<ContractDeployerConfig>('contractDeployer')

        return {
          node: {
            providerType: NodeProviderType.HTTP,
            url: networkCfg.fornoURL
          },
          wallet: {
            type: WalletType.Local,
            address: contractDeployerCfg.privateKey,
            privateKeys: [
              networkCfg.fund.privateKey,
              contractDeployerCfg.privateKey
            ].filter(key => key !== "")
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
  ],
})
export class ToolsModule {}
