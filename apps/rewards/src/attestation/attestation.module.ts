import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { NotifiedBlockRepository } from '../blocks/notifiedBlock.repository'
import { NotifiedBlockService } from '../blocks/notifiedBlock.service'
import { EventService } from '../event/eventService.service'
import { AttestationRepository } from './attestation.repository'
import { AttestationService } from './attestation.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([AttestationRepository]),
    TypeOrmModule.forFeature([NotifiedBlockRepository])
  ],
  providers: [AttestationService, NotifiedBlockService, EventService],
  exports: [TypeOrmModule]
})
export class AttestationModule {}
