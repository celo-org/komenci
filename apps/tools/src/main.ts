import { BlockchainModule } from '@app/blockchain';
import { NodeConfig, nodeConfig } from '@app/blockchain/config/node.config';
import { WalletConfig, walletConfig } from '@app/blockchain/config/wallet.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { AppConfig, appConfig } from 'apps/relayer/src/config/app.config';
import { deployMtxWalletDeployer } from 'apps/tools/src/deployMtxWalletDeployer.cmd';
import { deployMtxWalletForAddress } from 'apps/tools/src/deployMtxWalletForAddress.cmd';
import { deployMtxWalletImplementation } from 'apps/tools/src/deployMtxWalletImplementation.cmd';
import { LoggerModule, Logger } from 'nestjs-pino';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, nodeConfig, walletConfig],
      envFilePath: ['apps/relayer/.env.local']
    }),
    BlockchainModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          node: config.get<NodeConfig>('node'),
          wallet: config.get<WalletConfig>('wallet'),
          mtwDeployerAddress: config.get<AppConfig>('app').mtwDeployerAddress
        }
      }
    }),
    LoggerModule.forRootAsync({
      providers: [ConfigService],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const relayerConfig = config.get<AppConfig>('app')
        return {
          pinoHttp: {
            level: relayerConfig.log_level,
            prettyPrint: process.env.NODE_ENV !== 'production'
          }
        }
      }
    }),

  ],
  controllers: [],
  providers: [],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const logger: Logger = app.get(Logger)
  const cmd = process.argv[2]
  switch (cmd) {
    case "deploy-mtx-wallet-deployer":
      logger.log(`Running: ${cmd}`)
      await deployMtxWalletDeployer(app)
      return
    case "deploy-mtx-wallet-implementation":
      logger.log(`Running: ${cmd}`)
      await deployMtxWalletImplementation(app)
      return
    case "deploy-mtx-wallet-for-address":
      logger.log(`Running: ${cmd}`)
      await deployMtxWalletForAddress(app)
      return
    default:
      logger.debug(`No command: ${cmd}`)

  }
}
bootstrap();
