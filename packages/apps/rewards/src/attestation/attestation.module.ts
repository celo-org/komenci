import { AnalyticsService } from '@komenci/analytics'
import { KomenciLoggerService } from '@komenci/logger'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { NotifiedBlockRepository } from '../blocks/notifiedBlock.repository'
import { NotifiedBlockService } from '../blocks/notifiedBlock.service'
import { appConfig, AppConfig } from '../config/app.config'
import { EventService } from '../event/eventService.service'
import { AttestationRepository } from './attestation.repository'
import { AttestationService } from './attestation.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([AttestationRepository]),
    TypeOrmModule.forFeature([NotifiedBlockRepository])
  ],
  providers: [
    AttestationService,
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
export class AttestationModule {}
