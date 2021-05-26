import { AnalyticsService } from '@komenci/analytics'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { NotifiedBlockRepository } from '../blocks/notifiedBlock.repository'
import { NotifiedBlockService } from '../blocks/notifiedBlock.service'
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
    AnalyticsService
  ],
  exports: [TypeOrmModule]
})
export class AddressMappingsModule {}
