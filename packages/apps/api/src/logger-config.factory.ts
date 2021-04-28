import { buildLabels, levelFormatter } from '@komenci/core'
import { ConfigService } from '@nestjs/config'
import { AppConfig } from './config/app.config'
import { IncomingMessage, ServerResponse } from 'http'
import { Params } from 'nestjs-pino'
import { v4 as uuidv4 } from "uuid"

export const loggerConfigFactory = (config: ConfigService): Params => {
  const appCfg = config.get<AppConfig>('app')

  return {
    exclude: [
      "v1/health"
    ],
    pinoHttp: {
      formatters: {
        level: levelFormatter(appCfg),
        log(object) {
          const logObject = object as { err?: Error }
          const stackProp = logObject?.err?.stack
            ? { stack_trace: logObject.err.stack }
            : {}

          const httpRequest = 'res' in object ? {
            httpRequest: {...object},
            sessionId: (object as any).res.req?.session?.id,
            externalAccount: (object as any).res.req?.session?.externalAccount,
            res: undefined,
            responseTime: undefined
          } : {}

          return {
            ...object,
            ...stackProp,
            ...httpRequest
          }
        },
      },
      base: {
        ...buildLabels(appCfg)
      },
      customAttributeKeys: {
        req: 'logging.googleapis.com/trace'
      },
      genReqId: () => {
        return uuidv4()
      },
      customSuccessMessage: (res) => {
        return `Success`
      },
      customErrorMessage: (err, res) => {
        return `Error: ${err.message}`
      },
      messageKey: 'message',
      serializers: {
        httpRequest: ({res, error, responseTime}: {res: ServerResponse, error: Error, responseTime: number}) => {
          const req = (res as any).req as IncomingMessage
          return {
            requestMethod: req.method,
            requestUrl: req.url,
            requestSize: `${req.readableLength}`,
            status: res.statusCode,
            responseSize: res.getHeader('content-length'),
            userAgent: req.headers['user-agent'],
            remoteIp: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            referer: req.headers.referer,
            latency: `${responseTime/1000}s`,
          }
        },
        req: (req) => req.id
      },
      prettyPrint: process.env.NODE_ENV !== 'production'
    }
  }
}
