import { Injectable } from '@nestjs/common'
import { JwtService } from  '@nestjs/jwt'
import { Session } from  '../session.entity'
import { SessionService } from  '../session.service'

@Injectable()
export class AuthService {
    constructor(
        private readonly sessionService: SessionService,
        private readonly jwtService: JwtService
    ) {}

    public async login(session: Session): Promise< any | { status: number }> {
        return this.validate(session).then((sessionData)=> {
          if(!sessionData) {
            return { status: 404 }
          }
          const payload = `${sessionData.id}`
          const accessToken = this.jwtService.sign(payload)

          return {
             expires_in: 3600,
             access_token: accessToken,
             session: payload,
             status: 200
          }

        })
    }

    public async register(externalAccount: string): Promise<any> {
        return this.sessionService.createSession(externalAccount)
    } 

    private async validate(sessionData: Session): Promise<Session> {
        return this.sessionService.findOne(sessionData.id)
    }
}