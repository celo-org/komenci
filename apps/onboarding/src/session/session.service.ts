import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { Session } from './session.entity'


@Injectable()
export class SessionService {

  public constructor(
        @InjectRepository(Session)
        private readonly sessionRepository: Repository<Session>,
      ) {}

  async createSession(externalAccount: string): Promise<Session> {
    const session = new Session()
    session.id = uuidv4()
    session.externalAccount = externalAccount
    session.createdAt = Date.now()
    session.expiredAt = Date.now() + 3600
    session.completedAttestations = 0
    session.requestedAttestations = 0
    session.meta = {}
    session.completedAt = Date.now() + 36000
    const s = this.sessionRepository.create(session)
    const createdSession = await this.sessionRepository.save(session)
    return createdSession
  }

  findOne(id: number): Promise<Session> {
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
