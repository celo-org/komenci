import { BigQuery } from '@google-cloud/bigquery'
import { EventPayload, EventType, KomenciLoggerService } from '@komenci/logger'

const BIG_QUERY_PROJECT_ID = 'celo-testnet-production'

export class AnalyticsService {
  bigQuery: BigQuery

  constructor(
    private readonly logger: KomenciLoggerService,
    private readonly bigQueryDataset: string
  ) {
    this.bigQuery = new BigQuery({ projectId: `${BIG_QUERY_PROJECT_ID}` })
  }

  trackEvent<K extends keyof EventPayload>(event: K, payload: EventPayload[K]) {
    try {
      this.logger.event(event, payload)
      if (!this.bigQueryDataset) {
        this.logger.log('Big Query Dataset is not set')
        return
      }
      this.bigQuery
        .dataset(this.bigQueryDataset)
        .table(this.toTableName(event))
        .insert({
          ...payload,
          timestamp: Date.now() / 1000
        })
        .catch(error => {
          this.logger.error(error, `Error firing BigQuery event ${event}`)
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
    return result
      .split(' ')
      .join('_')
      .toLowerCase()
  }
}
