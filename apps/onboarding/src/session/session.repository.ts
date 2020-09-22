import { EntityRepository, Repository } from 'typeorm'
import { Session } from './session.entity'

@EntityRepository(Session)
export class SessionRepository extends Repository<Session> {}