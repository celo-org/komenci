import { BlockchainModule } from '@app/blockchain'
import { NodeProviderType } from '@app/blockchain/config/node.config'
import { KomenciLoggerModule } from '@app/komenci-logger'
import { ApiErrorFilter } from '@app/komenci-logger/filters/api-error.filter'
import { loggerConfigFactory } from '@app/onboarding/logger-config.factory'
import { NetworkConfig, networkConfig } from '@app/utils/config/network.config'
import { HttpModule, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { TypeOrmModule } from '@nestjs/typeorm'
import { InviteRewardModule } from 'apps/rewards/src/invite/inviteReward.module'
import { InviteRewardService } from 'apps/rewards/src/invite/inviteReward.service'
import { AttestationModule } from './attestation/attestation.module'
import { AttestationService } from './attestation/attestation.service'
import { NotifiedBlockService } from './blocks/notifiedBlock.service'
import { appConfig } from './config/app.config'
import { DatabaseConfig, databaseConfig } from './config/database.config'
import { EventService } from './event/eventService.service'

@Module({
  controllers: [],
  imports: [
    InviteRewardModule,
    AttestationModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, networkConfig],
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
  providers: [
    InviteRewardService,
    AttestationService,
    NotifiedBlockService,
    EventService,
    {
      provide: APP_FILTER,
      useClass: ApiErrorFilter
    }
  ]
})
export class AppModule {}
