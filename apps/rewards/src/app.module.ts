import { BlockchainModule } from '@app/blockchain'
import { NodeProviderType } from '@app/blockchain/config/node.config'
import { KomenciLoggerModule } from '@app/komenci-logger'
import { relayerConfig } from '@app/onboarding/config/relayer.config'
import { loggerConfigFactory } from '@app/onboarding/logger-config.factory'
import { NetworkConfig, networkConfig } from '@app/utils/config/network.config'
import { HttpModule, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { TypeOrmModule } from '@nestjs/typeorm'
import { InviteRewardModule } from 'apps/rewards/src/invite/inviteReward.module'
import { AttestationModule } from './attestation/attestation.module'
import { appConfig } from './config/app.config'
import { DatabaseConfig, databaseConfig } from './config/database.config'

@Module({
  controllers: [],
  imports: [
    InviteRewardModule,
    AttestationModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, networkConfig, relayerConfig],
      envFilePath: ['apps/rewards/.env.local', 'apps/rewards/.env']
    }),
    KomenciLoggerModule.forRootAsync({
      providers: [ConfigService],
      inject: [ConfigService],
      useFactory: loggerConfigFactory
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
        return {
          node: {
            providerType: NodeProviderType.HTTP,
            url: networkCfg.fornoURL
          }
        }
      }
    })
  ],
  providers: []
})
export class AppModule {}
