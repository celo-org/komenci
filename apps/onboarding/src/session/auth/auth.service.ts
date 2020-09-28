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

    public async access(externalAccount: string): Promise< any | { status: number }> {
        let session = await this.validateAccount(externalAccount)

        if(!session) {
            session = await this.sessionService.createSession(externalAccount)
        }
        return this.validate(session).then((sessionData)=> {
            if(!sessionData) {
              return { status: 404 }
            }
            const payload = {sessionId : `${sessionData.id}`}
            const accessToken = this.jwtService.sign(payload)
            
            return {
               access_token: accessToken,
               status: 200
            }
          })
    } 

    public async verify(accessToken: string): Promise<boolean> {
        return this.verify(accessToken)
    }

    private async validateAccount(externalAccount: string): Promise<Session> {
        return this.sessionService.findByAccount(externalAccount)
    }

    private async validate(sessionData: Session): Promise<Session> {
        return this.sessionService.findOne(sessionData.id)
    }
}