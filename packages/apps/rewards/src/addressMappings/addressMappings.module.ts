import { AnalyticsService } from '@komenci/analytics'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { KomenciLoggerService } from 'packages/libs/logger/dist'
import { NotifiedBlockRepository } from '../blocks/notifiedBlock.repository'
import { NotifiedBlockService } from '../blocks/notifiedBlock.service'
import { AppConfig, appConfig } from '../config/app.config'
import { EventService } from '../event/eventService.service'
import { AddressMappingsRepository } from './addressMappings.repository'
import { AddressMappingsService } from './addressMappings.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([AddressMappingsRepository]),
    TypeOrmModule.forFeature([NotifiedBlockRepository])
  ],
  providers: [
    AddressMappingsService,
    NotifiedBlockService,
    EventService,
    {
      provide: AnalyticsService,
      useFactory: (logger: KomenciLoggerService, appCfg: AppConfig) => {
        return new AnalyticsService(logger, appCfg.segmentApiKey)
      },
      inject: [KomenciLoggerService, appConfig.KEY]
    }
  ],
  exports: [TypeOrmModule]
})
export class AddressMappingsModule {}
