import { BadRequestException, Injectable } from '@nestjs/common'
import { JwtService } from  '@nestjs/jwt'
import { Session } from 'apps/onboarding/src/session/session.entity'
import { SessionService } from 'apps/onboarding/src/session/session.service'
import { isLeft } from 'fp-ts/Either'
import * as t from 'io-ts'

export const TokenPayload = t.type({
    sessionId: t.string
})

export type TokenPayload = t.TypeOf<typeof TokenPayload>

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly sessionService: SessionService
    ) {}

    public async startSession(externalAccount: string): Promise<string> {
        const session = await this.sessionService.findOrCreateForAccount(externalAccount)
        const payload: TokenPayload = {
            sessionId: session.id
        }
        return this.jwtService.sign(payload)
    }

    public async recoverSession(tokenPayload: unknown): Promise<Session> {
        const result = TokenPayload.decode(tokenPayload)
        if (isLeft(result)) {
            throw new BadRequestException("Invalid or outdated token payload")
        }
        const payload = result.right
        const session = await this.sessionService.findOne(payload.sessionId)
        if (session && session.isOpen()) {
            return session
        } else {
            throw new BadRequestException("Session no longer available")
        }
    }
}