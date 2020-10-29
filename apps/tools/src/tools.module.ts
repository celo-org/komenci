import { BlockchainModule, ContractsModule } from '@app/blockchain'
import { nodeConfig, NodeConfig } from '@app/blockchain/config/node.config'
import { walletConfig, WalletConfig } from '@app/blockchain/config/wallet.config'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { appConfig, AppConfig } from 'apps/relayer/src/config/app.config'
import { FundingConfig, fundingConfig } from 'apps/tools/src/config/funding.config'
import { ConsoleModule } from 'nestjs-console'
import { LoggerModule } from 'nestjs-pino'
import { FundsService } from './funds.service'

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
      load: [fundingConfig, nodeConfig, walletConfig],
      envFilePath: [
        'apps/tools/.env.local',
        'apps/tools/.env',
      ]
    }),
    BlockchainModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          node: config.get<NodeConfig>('node'),
          wallet: config.get<WalletConfig>('wallet'),
        }
      }
    }),
    ContractsModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const cfg = config.get<FundingConfig>('funding')
        const wallet = config.get<WalletConfig>('wallet')

        return {
          deployerAddress: cfg.metaTxWalletDeployer,
          walletAddress: wallet.address
        }
      },
    }),
  ],
  providers: [
    FundsService,
  ],
})
export class ToolsModule {}
