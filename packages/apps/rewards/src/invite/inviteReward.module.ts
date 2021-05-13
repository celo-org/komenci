import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ClientProxyFactory, TcpClientOptions } from '@nestjs/microservices'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AnalyticsService } from '@komenci/analytics'
import { KomenciLoggerService } from '@komenci/logger'
import { AttestationRepository } from '../attestation/attestation.repository'
import { NotifiedBlockRepository } from '../blocks/notifiedBlock.repository'
import { NotifiedBlockService } from '../blocks/notifiedBlock.service'
import { EventService } from '../event/eventService.service'
import { RelayerProxyService } from '../relayer/relayer_proxy.service'
import { InviteRewardRepository } from './inviteReward.repository'
import { InviteRewardService } from './inviteReward.service'
import { RewardSenderService } from './rewardSender.service'
import { AppConfig, appConfig } from '../config/app.config'

@Module({
  imports: [
    TypeOrmModule.forFeature([InviteRewardRepository]),
    TypeOrmModule.forFeature([AttestationRepository]),
    TypeOrmModule.forFeature([NotifiedBlockRepository])
  ],
  providers: [
    InviteRewardService,
    RewardSenderService,
    NotifiedBlockService,
    EventService,
    RelayerProxyService,
    {
      provide: 'RELAYER_SERVICE',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const relayerSvcOptions = configService.get<TcpClientOptions>('relayer')
        return ClientProxyFactory.create(relayerSvcOptions)
      }
    },
    {
      provide: AnalyticsService,
      useFactory: (logger: KomenciLoggerService, appConfig: AppConfig) => {
        return new AnalyticsService(logger, appConfig.bigQueryDataset);
      },
      inject: [KomenciLoggerService, appConfig.KEY],
    }
  ],
  exports: [TypeOrmModule]
})
export class InviteRewardModule {}
