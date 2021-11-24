import { BlockchainModule } from '@komenci/blockchain'
import { NodeProviderType } from '@komenci/blockchain/dist/config/node.config'
import { NetworkConfig, networkConfig } from '@komenci/core'
import { KomenciLoggerModule, loggerConfigFactory } from '@komenci/logger'
import { HttpModule, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AddressMappingsModule } from './addressMappings/addressMappings.module'
import { AttestationModule } from './attestation/attestation.module'
import { AppConfig, appConfig } from './config/app.config'
import { DatabaseConfig, databaseConfig } from './config/database.config'
import { relayerConfig } from './config/relayer.config'
import { InviteRewardModule } from './invite/inviteReward.module'

@Module({
  controllers: [],
  imports: [
    InviteRewardModule,
    AttestationModule,
    AddressMappingsModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, networkConfig, relayerConfig],
      envFilePath: ['.env.local', '.env']
    }),
    KomenciLoggerModule.forRootAsync({
      providers: [ConfigService],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const appCfg = config.get<AppConfig>('app')
        return loggerConfigFactory(appCfg)
      }
    }),
    HttpModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get<DatabaseConfig>('database')
    }),
    BlockchainModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const networkCfg = config.get<NetworkConfig>('network')
        const appCfg = config.get<AppConfig>('app')
        return {
          node: {
            providerType: NodeProviderType.HTTP,
            url: networkCfg.fornoURL,
            nodeApiKey: appCfg.fornoApiKey,
          }
        }
      }
    })
  ],
  providers: []
})
export class AppModule {}
