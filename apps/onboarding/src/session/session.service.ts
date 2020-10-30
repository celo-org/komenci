import { normalizeAddress, trimLeading0x } from '@celo/base'
import { Inject, Injectable } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'
import { v4 as uuidv4 } from 'uuid'
import { Session, SessionQuota } from './session.entity'
import { SessionRepository } from './session.repository'
import { quotaConfig } from '../config/quota.config'
import { ApiError } from '../errors/api-error'

class QuotaExceededError extends ApiError<'QuotaExceededError'> {
  statusCode = 403

  constructor(quota: SessionQuota) {
    super('QuotaExceededError')
    this.message = `Quota '${quota}' exceeded`
  }
}

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
      completedAttestations: 0,
      requestedAttestations: 0,
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
    if (existingSession === undefined || !existingSession.isOpen()) {
      const newSession = this.create(externalAccount)
      return newSession
    } else {
      return existingSession
    }
  }

  async checkSessionQuota(session: Session, quota: SessionQuota, updateUsage: boolean = true) {
    const usage = session.checkQuota(quota, updateUsage)
    if (updateUsage) {
      await this.update(session.id, session)
    }
    if (usage >= this.config[quota]) {
      throw new QuotaExceededError(quota)
    }
    return true
  }
}
