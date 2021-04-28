import { v4 as uuidv4 } from 'uuid'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'
import { Inject, Injectable } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { normalizeAddress, trimLeading0x } from '@celo/base'
import { ActionCounts, quotaConfig, TrackedAction } from '../config/quota.config'
import { Session } from './session.entity'
import { SessionRepository } from './session.repository'

@Injectable()
export class SessionService {

  constructor(
    @Inject(quotaConfig.KEY)
    private config: ConfigType<typeof quotaConfig>,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async create(externalAccount: string): Promise<Session> {
    const session = Session.of({
      id: uuidv4(),
      externalAccount: normalizeAddress(externalAccount),
      createdAt: new Date(Date.now()).toISOString(),
    })
    return this.sessionRepository.save(session)
  }

  async update(sessionId: string, attributes: QueryDeepPartialEntity<Session>) {
    return this.sessionRepository.update(sessionId, attributes)
  }


  findOne(id: string): Promise<Session> {
    return this.sessionRepository.findOne(id)
  }

  async findLastForAccount(account: string) {
    return this.sessionRepository.findOne(
      { externalAccount: trimLeading0x(account) },
      { order: { createdAt: "DESC" } }
    )
  }

  async removeSession(id: string): Promise<void> {
    await this.sessionRepository.delete(id)
  }

  async findOrCreateForAccount(externalAccount: string): Promise<Session> {
    const existingSession = await this.findLastForAccount(externalAccount)
    if (existingSession === undefined || !this.hasQuota(existingSession)) {
      const newSession = this.create(externalAccount)
      return newSession
    } else {
      return existingSession
    }
  }

  async incrementUsage(session: Session, action: TrackedAction, count: number = 1) {
    return this.update(session.id, {
      meta: {
        ...session.meta,
        callCount: {
          ...(session.meta?.callCount || {}),
          [action]: session.getActionCount(action) + count
        }
      }
    })
  }

  quotaLeft(session: Session): ActionCounts {
    return Object.values(TrackedAction).reduce((quota, action) => {
      quota[action] = this.config[action] - session.getActionCount(action)
      return quota
    }, {})
  }

  private hasQuota(session: Session): boolean {
    const quota = this.quotaLeft(session)
    return Object.values(quota).every(q => q > 0)
  }

}
