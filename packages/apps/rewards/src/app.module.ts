import { BlockchainModule } from '@komenci/blockchain'
import { NodeProviderType } from '@komenci/blockchain/dist/config/node.config'
import { NetworkConfig, networkConfig } from '@komenci/core'
import { KomenciLoggerModule, loggerConfigFactory } from '@komenci/logger'
import { ApiErrorFilter } from '@komenci/logger/dist/filters/api-error.filter'
import { HttpModule, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { TypeOrmModule } from '@nestjs/typeorm'
import { appConfig, AppConfig } from './config/app.config'
import { DatabaseConfig, databaseConfig } from './config/database.config'
import { InviteRewardModule } from './invite/inviteReward.module'
import { InviteRewardService } from './invite/inviteReward.service'

@Module({
  controllers: [],
  imports: [
    InviteRewardModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, networkConfig],
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
