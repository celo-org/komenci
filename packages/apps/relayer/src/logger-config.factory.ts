import { WalletConfig } from '@komenci/blockchain/dist/config/wallet.config'
import { buildLabels, levelFormatter } from '@komenci/logger'
import { ConfigService } from '@nestjs/config'
import { Params } from 'nestjs-pino'
import { AppConfig } from './config/app.config'

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