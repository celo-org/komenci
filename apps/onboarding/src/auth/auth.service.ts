import { ApiError } from '@app/komenci-logger/errors'
import { Injectable } from '@nestjs/common'
import { JwtService } from  '@nestjs/jwt'
import { Session } from 'apps/onboarding/src/session/session.entity'
import { SessionService } from 'apps/onboarding/src/session/session.service'
import { isLeft } from 'fp-ts/Either'
import * as t from 'io-ts'

export const TokenPayload = t.type({
  sessionId: t.string
})

export type TokenPayload = t.TypeOf<typeof TokenPayload>

export enum AuthErrorTypes {
  InvalidToken = "InvalidToken",
  SessionUnavailable = "SessionUnavailable"
}

export class InvalidToken extends ApiError<AuthErrorTypes.InvalidToken, undefined> {
  statusCode = 401
  constructor() {
    super(AuthErrorTypes.InvalidToken)
    this.message = 'Invalid or outdated token'
  }
}

export class SessionUnavailable extends ApiError<AuthErrorTypes.SessionUnavailable> {
  statusCode = 401
  constructor(meta: {sessionId: string}) {
    super(AuthErrorTypes.SessionUnavailable, meta)
    this.message = 'Session no longer available'
  }
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService
  ) {}

  public async startSession(externalAccount: string): Promise<{ sessionId: string, token: string }> {
    const session = await this.sessionService.findOrCreateForAccount(externalAccount)
    const payload: TokenPayload = {
      sessionId: session.id
    }
    return {
      sessionId: session.id,
      token: this.jwtService.sign(payload)
    }
  }

  public async recoverSession(tokenPayload: unknown): Promise<Session> {
    const result = TokenPayload.decode(tokenPayload)
    if (isLeft(result)) {
      throw new InvalidToken()
    }
    const payload = result.right
    const session = await this.sessionService.findOne(payload.sessionId)
    if (session) {
      return session
    } else {
      throw new SessionUnavailable({sessionId: payload.sessionId})
    }
  }
}