const levelToSeverity = {
  trace: 'DEBUG',
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARNING',
  error: 'ERROR',
  fatal: 'CRITICAL',
}

interface ServiceConfig {
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

