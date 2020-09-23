import { Injectable } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'
import { Session } from './session.entity'
import { SessionRepository } from './session.repository'


@Injectable()
export class SessionService {

  constructor(private readonly sessionRepository: SessionRepository,) {}

  async createSession(externalAccount: string): Promise<Session> {
    const session = new Session()
    session.id = uuidv4()
    session.externalAccount = externalAccount
    session.createdAt = new Date(Date.now()).toISOString()
    session.expiredAt = new Date(Date.now()+ 3600).toISOString()
    session.completedAttestations = 0
    session.requestedAttestations = 0
    session.meta = {"metadata": "TBD"}
    session.completedAt = new Date(Date.now() + 36000).toISOString()
    const s = this.sessionRepository.create(session)
    const createdSession = await this.sessionRepository.save(session)
    return createdSession
  }

  findOne(id: string): Promise<Session> {
    return this.sessionRepository.findOne(id)
  }

  findAll() {
    return this.sessionRepository.find()
  }

  async removeSession(id: string): Promise<void> {
    await this.sessionRepository.delete(id)
    return null
  }
}
