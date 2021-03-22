import { BlockchainModule, ContractsModule } from '@app/blockchain'
import { NodeProviderType } from '@app/blockchain/config/node.config'
import { KomenciLoggerModule, KomenciLoggerService } from '@app/komenci-logger'
import { ApiErrorFilter } from '@app/komenci-logger/filters/api-error.filter'
import { loggerConfigFactory } from '@app/onboarding/logger-config.factory'
import { NetworkConfig, networkConfig } from '@app/utils/config/network.config'
import { HttpModule, Module, Scope } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER } from '@nestjs/core'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ScheduleModule } from '@nestjs/schedule'
import { appConfig } from './config/app.config'
import { DatabaseConfig, databaseConfig } from './config/database.config'
import { InviteRewardModule } from 'apps/rewards/src/invite/inviteReward.module'
import { InviteRewardService } from 'apps/rewards/src/invite/inviteReward.service'

@Module({
  controllers: [],
  imports: [
    InviteRewardModule,
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
    {
      provide: APP_FILTER,
      useClass: ApiErrorFilter
    }
  ]
})
export class AppModule {}
