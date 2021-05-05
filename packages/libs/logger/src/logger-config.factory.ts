import { IncomingMessage, ServerResponse } from 'http'
import { Params } from 'nestjs-pino'
import { v4 as uuidv4 } from "uuid"

const levelToSeverity = {
  trace: 'DEBUG',
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARNING',
  error: 'ERROR',
  fatal: 'CRITICAL',
}

export interface ServiceConfig {
  version: string,
  service: string

}

export const levelFormatter = (serviceCfg: ServiceConfig) => (label: string) => {
  const pinoLevel = label
  const severity = levelToSeverity[pinoLevel]
  const typeProp =
    pinoLevel === 'error' || pinoLevel === 'fatal'
      ? {
        '@type':
          'type.googleapis.com/google.devtools.clouderrorreporting.v1beta1.ReportedErrorEvent',
        'serviceContext': {
          service: serviceCfg.service,
          version: serviceCfg.version
        }
      }
      : {}
  return { severity, ...typeProp }
}

export const buildLabels = (serviceCfg: ServiceConfig, extra: any = {}) => ({
  ['logging.googleapis.com/labels']: {
    service: serviceCfg.service,
    version: serviceCfg.version,
    ...extra
  }
})

export const loggerConfigFactory = (serviceCfg: ServiceConfig): Params => {

  return {
    exclude: [
      "v1/health"
    ],
    pinoHttp: {
      formatters: {
        level: levelFormatter(serviceCfg),
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
        ...buildLabels(serviceCfg)
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
