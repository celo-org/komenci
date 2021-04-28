import { WalletConfig } from '@app/blockchain/config/wallet.config'
import { buildLabels, levelFormatter } from '@app/utils/logger'
import { ConfigService } from '@nestjs/config'
import { AppConfig } from 'apps/relayer/src/config/app.config'
import { Params } from 'nestjs-pino'

export const loggerConfigFactory = (config: ConfigService): Params => {
  const appCfg = config.get<AppConfig>('app')
  const walletCfg = config.get<WalletConfig>('wallet')

  return {
    pinoHttp: {
      formatters: {
        level: levelFormatter(appCfg)
      },
      base: {
        ...buildLabels(appCfg, {
          relayer: walletCfg.address
        })
      },
      messageKey: 'message',
      prettyPrint: process.env.NODE_ENV !== 'production'
    }
  }
}