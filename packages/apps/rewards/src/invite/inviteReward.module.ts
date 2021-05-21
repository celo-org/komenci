import { AnalyticsService } from '@komenci/analytics'
import { KomenciLoggerService } from '@komenci/logger'
import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ClientProxyFactory, TcpClientOptions } from '@nestjs/microservices'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AttestationRepository } from '../attestation/attestation.repository'
import { NotifiedBlockRepository } from '../blocks/notifiedBlock.repository'
import { NotifiedBlockService } from '../blocks/notifiedBlock.service'
import { AppConfig, appConfig } from '../config/app.config'
import { EventService } from '../event/eventService.service'
import { RelayerProxyService } from '../relayer/relayer_proxy.service'
import { InviteRewardController } from './inviteReward.controller'
import { InviteRewardRepository } from './inviteReward.repository'
import { InviteRewardService } from './inviteReward.service'
import { RewardSenderService } from './rewardSender.service'

@Module({
  controllers: [InviteRewardController],
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
      useFactory: (logger: KomenciLoggerService, appCfg: AppConfig) => {
        return new AnalyticsService(logger, appCfg.bigQueryDataset)
      },
      inject: [KomenciLoggerService, appConfig.KEY]
    }
  ],
  exports: [TypeOrmModule]
})
export class InviteRewardModule {}
