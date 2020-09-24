import { Injectable } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'
import { Session } from './session.entity'
import { SessionRepository } from './session.repository'


@Injectable()
export class SessionService {

  constructor(private readonly sessionRepository: SessionRepository,) {}

  async createSession(externalAccount: string): Promise<Session> {
    const session = Session.of({
      id: uuidv4(),
      externalAccount: externalAccount,
      createdAt: new Date(Date.now()).toISOString(),
      expiredAt: new Date(Date.now()+ 3600).toISOString(),
      completedAttestations: 0,
      requestedAttestations: 0,
      meta: {"metadata": "TBD"},
      completedAt: new Date(Date.now() + 36000).toISOString()
    })
    this.sessionRepository.create(session)
    return this.sessionRepository.save(session)
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
