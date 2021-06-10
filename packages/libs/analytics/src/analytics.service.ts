import { EventPayload, EventType, KomenciLoggerService } from '@komenci/logger'
import Analytics from 'analytics-node'

export class AnalyticsService {
  analytics: Analytics | undefined

  constructor(private readonly logger: KomenciLoggerService, apiKey: string) {
    if (apiKey) {
      this.analytics = new Analytics(apiKey)
    }
  }

  trackEvent<K extends keyof EventPayload>(event: K, payload: EventPayload[K]) {
    try {
      this.logger.event(event, payload)
      this.analytics?.track({
        anonymousId: 'rewards-service',
        event: this.toTableName(event),
        properties: {
          timestamp: Date.now() / 1000,
          ...payload
        }
      })
    } catch (error) {
      this.logger.error(error, `Error tracking event ${event}`)
    }
  }

  /**
   * The event is in PascalCase and the table name should be in snake_case.
   * We first replace each capitalized letter and trim to remove the leading space,
   * then separate the words and join again using underscores.
   */
  private toTableName(event: EventType) {
    const result = event.replace(/([A-Z])/g, ' $1').trim()
    return result.split(' ').join('_').toLowerCase()
  }
}
