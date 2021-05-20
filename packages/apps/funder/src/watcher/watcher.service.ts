import {Inject, Injectable, OnModuleInit} from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { SchedulerRegistry } from '@nestjs/schedule'
import { CronJob } from "cron"
import {AppConfig, appConfig} from "../config/app.config"
import { TokenService } from './token.service'


@Injectable()
export class WatcherService implements OnModuleInit {
  private tokens: TokenService[]

  constructor(
    @Inject(appConfig.KEY) private appCfg: AppConfig,
    private moduleRef: ModuleRef,
    private schedulerRegistry: SchedulerRegistry
  ) {}

  async onModuleInit() {
    this.tokens = await Promise.all(this.appCfg.tokens.map(async (tokenConfig) => {
      const tokenService = await this.moduleRef.create(TokenService)
      await tokenService.init(tokenConfig)
      const job = new CronJob(tokenConfig.cron, async () => {
        return tokenService.tick()
      })
      this.schedulerRegistry.addCronJob(`token_${tokenConfig.token}_job`, job)
      job.start()
      return tokenService
    }))
  }
}
