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
      completedAttestations: 0,
      requestedAttestations: 0,
    })
    return this.sessionRepository.save(session)
  }

  findOne(id: string): Promise<Session> {
    return this.sessionRepository.findOne(id)
  }

  async findByAccount(account: string) {
    return this.sessionRepository.findOne(
      { externalAccount: account },
      { order: { createdAt: "DESC" } }
    )
  }

  findAll() {
    return this.sessionRepository.find()
  }

  async removeSession(id: string): Promise<void> {
    await this.sessionRepository.delete(id)

    return null
  }

  async findOrCreateForAccount(externalAccount: string): Promise<Session> {
    const existingSession = await this.findByAccount(externalAccount)
    if (existingSession === undefined || !existingSession.isOpen()) {
      const newSession = this.createSession(externalAccount)
      return newSession
    } else {
      return existingSession
    }
  }
}
